import {Building} from './classes/Buiding.js';
import {Enemy} from './classes/Enemy.js';
import {PlacementTile} from './classes/PlacementTile.js';
import {ProjectTile} from './classes/ProjectTile.js';
import {config} from './data/config.js';
import {placementTilesData} from './data/placementTilesData.js';
import {waypoints} from './data/waypoints.js';
import {canvas, c} from './data/canvas.js';
import {Hand, Deck, Card, HandRankResult} from './classes/Card.js';
import {SummonButton} from './classes/SummonButton.js';
import {RankTower} from './classes/RankTower.js';
import {HandRank} from './enums/handRank.js';
import {PlayerBoard} from './classes/PlayerBoard.js';
import {Coins} from './classes/Coins.js';
import {Hearts} from './classes/Hearts.js';
import {Stage} from './classes/Stage.js';
import {CoinPlus} from './classes/Effect/CoinPlus.js';
import {CoinMinus} from './classes/Effect/CoinMinus.js';

const grid = config.grid

canvas.width = grid * config.numOfWidth
canvas.height = grid * config.numOfHeight

const backGround = new Image()
backGround.onload = () => {
  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
}
backGround.src = 'img/backGround.png'

const playerBoard = new PlayerBoard();
const summonButton = new SummonButton();

const placementTiles = []
placementTilesData.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 1) {
      placementTiles.push(
        new PlacementTile({
          position: {
            x: x * grid,
            y: y * grid
          }
        })
      )
    }
  })
})

function drawGrid() {
  c.strokeStyle = '#2E8B57'; // 어두운 초록색
  c.lineWidth = 2;

  const startX = Math.floor((canvas.width - 5 * grid) / 2);
  const startY = Math.floor((canvas.height - 3.5 * grid) / 2);
  const endX = startX + 5 * grid;
  const endY = startY + 3 * grid;

  // 세로선 (중앙 5칸)
  for (let x = startX; x <= endX; x += grid) {
    c.beginPath();
    c.moveTo(x, startY);
    c.lineTo(x, endY);
    c.stroke();
  }

  // 가로선 (중앙 3칸)
  for (let y = startY; y <= endY; y += grid) {
    c.beginPath();
    c.moveTo(startX, y);
    c.lineTo(endX, y);
    c.stroke();
  }
}

const enemies = []
const buildings = []
const effects = []
let activeTile = undefined
let isMouseInSummonButton = false

const coins = new Coins();
const hearts = new Hearts();
const stage = new Stage();

const summonNum = 10

const hand = new Hand()
const deck = new Deck()
let canEditCard = true

let isDragging = false
let mouseDownPos = {x: null, y: null};
let mouseUpPos = {x: null, y: null};
const DRAG_THRESHOLD = 3

function animate() {
  const animationId = requestAnimationFrame(animate);

  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
  drawGrid()
  playerBoard.update(pickedBuilding, mouse, hand, getReRollCost(), getRaiseCost())
  coins.draw()
  hearts.draw()
  stage.draw()
  // summonButton.update(isMouseInSummonButton, hand.handRankResult)

  if (enemies.length === 0) {
    stage.round += 1
    const multiplier = 1 + ((1 / 5) * (stage.round - 1))
    const monsterNum = (summonNum * multiplier)

    const icon = Enemy.selectIcon();
    for (let i = 1; i < monsterNum + 1; i++) {
      const yOffset = (i * grid * summonNum) / monsterNum
      enemies.push(
        new Enemy({
            position: {
              x: waypoints[0].x,
              y: waypoints[0].y + yOffset
            }
          }, multiplier,
          icon
        )
      )
    }
  }

  for (let i = enemies.length - 1; 0 <= i; i--) {
    const enemy = enemies[i];
    enemy.update()

    if (enemy.waypointIndex === waypoints.length - 1 && enemy.position.y > canvas.height) {
      hearts.life -= 1
      enemies.splice(i, 1)
      if (hearts.life === 0) {
        console.log("game over")
        hearts.draw()
        cancelAnimationFrame(animationId)
        document.querySelector('#gameOver').style.display = 'flex'
      }
    }
  }

  for (let i = enemies.length - 1; 0 <= i; i--) {
    enemies[i].drawLifeBar()
  }

  // placementTiles.forEach((tile => {
  //   tile.update(mouse)
  // }))

  buildings.forEach((building => {

    building.target = null;

    const validEnemies = enemies.map((enemy) => {
      const xDiff = enemy.center.x - building.center.x;
      const yDiff = enemy.center.y - building.center.y;
      const distance = Math.hypot(xDiff, yDiff);

      return {enemy, distance};
    }).filter(({enemy, distance}) => distance < enemy.radius + building.getRadius() && enemy.isInBoard()).sort((a, b) => a.distance - b.distance)

    const n = 1; // 추출할 개수 설정
    building.target = validEnemies.slice(0, n).map((item) => item.enemy)[0];

    if (!building.isPicked) {
      building.update(mouse)
    }

    for (let i = building.projectTiles.length - 1; 0 <= i; i--) {

      const tile = building.projectTiles[i]
      tile.update()

      //when hit the enemy
      if (tile.isHitTheEnemy()) {
        tile.applyDamage()

        //적 죽을 때 제거
        const tileEnemy = tile.enemy;
        if (tileEnemy.health <= 0 && tileEnemy.isDeath === false) {
          tileEnemy.isDeath = true
          const index = enemies.findIndex((enemy) => {
            return tileEnemy === enemy
          });

          if (index > -1) {
            let income = tileEnemy.reward;
            coins.balance += income
            enemies.splice(index, 1)
            effects.push(new CoinPlus(tileEnemy.center, income))
          }
        }
        building.projectTiles.splice(i, 1)
      }
    }

    //돈 획득
    for (let i = effects.length - 1; 0 <= i; i--) {
      let effect = effects[i];
      effect.update()
      if (effect.isEnd()) {
        effects.splice(i, 1)
      }
    }

    //드래그된 빌딩 그리기
    if (pickedBuilding) {
      pickedBuilding.drawDragging(mouse.x, mouse.y)

      // //판매 가격 표시
      // c.fillStyle = 'black';
      // c.font = `bold ${grid * 0.25}px "Changa One", "Noto Sans", sans-serif`;
      // c.textAlign = "center";
      // c.textBaseline = "middle";
      //
      // c.fillText('💰', mouse.x - grid * 0.1, mouse.y);
      //
      // const sellingPrice = pickedBuilding.getSellingMultiplier() * getReRollCost()
      // c.fillText(sellingPrice.toString(), mouse.x + grid * 0.3, mouse.y);

    }
  }))

}

const mouse = {
  x: undefined,
  y: undefined
}

let cardPrice = 10

window.addEventListener('click', (event) => {

  //드래그일경우
  if ((Math.abs(mouseDownPos.x - event.clientX) > DRAG_THRESHOLD || Math.abs(mouseDownPos.y - event.clientY) > DRAG_THRESHOLD)) {
    isDragging = false
    mouseDownPos.x = null
    mouseUpPos.x = null
    return
  }

  const cardCost = getReRollCost()
  if (buildings.length < 11 && hand.isEmpty() && isMouseInSummonButton && !pickedBuilding && coins.balance >= cardCost && canEditCard) {
    // reRoll
    reRoll()

    const {x, y} = playerBoard.centerButton.center;
    effects.push(new CoinMinus({x, y}, cardCost))
    return;
  }

  const raiseCost = getRaiseCost()

  if (buildings.length < 15 && !pickedBuilding && !hand.isEmpty() && playerBoard.raiseButtion.isMouseInside(mouse) && coins.balance >= raiseCost && canEditCard) {
    // raise
    coins.balance -= raiseCost
    drawRandomCard()
    const {x, y} = playerBoard.raiseButtion.center;
    effects.push(new CoinMinus({x, y}, raiseCost))
    return;
  }

  if (!pickedBuilding && hand.handRankResult && canEditCard && hand.cardList.length > 0) {

    //기물 소환
    if (playerBoard.centerButton.isMouseInside(mouse)) {
      canEditCard = false

      const handRankResult = {...hand.handRankResult}

      for (let i = buildings.length - 1; 0 <= i; i--) {
        // 빌딩 순회
        let building = buildings[i];
        let buildingCard = building.card;

        if (buildingCard) {

          if (buildingCard.equal(handRankResult.topCards[0])) {
            building.rankTower = new RankTower(handRankResult.name, handRankResult.topCards)

            hand.removeCard(building.card)
            deck.trash(building.card)
            building.card = null
          } else {
            removeBuilding(building)
          }
        }
      }
      canEditCard = true
    }

    if (playerBoard.dieButton.isMouseInside(mouse)) {
      canEditCard = false

      for (let i = buildings.length - 1; 0 <= i; i--) {
        // 빌딩 순회
        let building = buildings[i];
        let buildingCard = building.card;

        if (buildingCard) {
          removeBuilding(building)
        }
      }
      canEditCard = true
    }
  }

  isDragging = false;
  mouseDownPos.x = null
  mouseUpPos.x = null
})

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY

    if (mouseDownPos.x
        && Math.abs(mouse.x - mouseDownPos.x) > DRAG_THRESHOLD
        && Math.abs(mouse.y - mouseDownPos.y) > DRAG_THRESHOLD) {
      isDragging = true
    }

    activeTile = null
    for (let i = 0; i < placementTiles.length; i++) {
      const tile = placementTiles[i]
      if (
        tile.position.x < mouse.x
        && mouse.x < tile.position.x + tile.size
        && tile.position.y < mouse.y
        && mouse.y < tile.position.y + tile.size
      ) {
        activeTile = tile
        break
      }
    }

    isMouseInSummonButton = summonButton.isMouseInside(mouse)

  }
)

let pickedBuilding = null

window.addEventListener('mousedown', (event) => {

    mouseDownPos.x = event.clientX
    mouseDownPos.y = event.clientY
    isDragging = false

    if (pickedBuilding === null) {
      for (let i = buildings.length - 1; 0 <= i; i--) {
        if (pickedBuilding === null) {
          let building = buildings[i];
          if (building.isMouseIn(mouse)) {
            pickedBuilding = building
            building.isPicked = true
          }
        }
      }
    }
  }
)

window.addEventListener('mouseup', (event) => {

    if (pickedBuilding && pickedBuilding.isPicked && pickedBuilding.rankTower) {

      if (isInObject(event, playerBoard)) {
        //빌딩 판매.
        removeBuilding(pickedBuilding)
      }
    }
    if (pickedBuilding) {
      pickedBuilding.isPicked = false
      pickedBuilding = null
    }
  }
)

animate()

function isInObject(position, object) {
  if (!position || !object) {
    return false
  }

  return object.position.x < position.x && position.x < object.position.x + object.width
         && object.position.y < position.y && position.y < object.position.y + object.height
}

function getReRollCost() {
  return cardPrice * (1 + buildings.filter((building) => {
    return building.rankTower
  }).length)
}

function getRaiseCost() {
  const numOfCard = buildings.filter((building) => {
    return building.card
  }).length;

  if (numOfCard <= 5) {
    return getReRollCost()
  }

  return cardPrice * (2 ** (numOfCard - 5))
}

function removeBuilding(building) {

  if (building.card) {
    hand.removeCard(building.card)
    deck.trash(building.card)
  }

  if (building.rankTower) {
    coins.balance += building.getSellingMultiplier() * getReRollCost()
  }

  let index = buildings.findIndex(b => b.position.x === building.position.x && b.position.y === building.position.y);
  buildings.splice(index, 1)

  placementTiles.forEach((tile) => {
    if (tile.position.x === building.position.x && tile.position.y === building.position.y) {
      tile.isOccupied = false
    }
  })
}

function draw() {
  canEditCard = false
  const card = deck.draw();
  hand.addCard(card);
  canEditCard = true
  return card
}

function drawOneCard() {

  const card = draw()
  coins.balance -= getReRollCost()
  buildings.push(new Building({
    position: {
      x: activeTile.position.x,
      y: activeTile.position.y
    }
  }, card))

  activeTile.isOccupied = true
}

function reRoll() {
  canEditCard = false
  getReRollCost()
  coins.balance -= getReRollCost()

  for (let i = 0; i < 5; i++) {
    drawRandomCard()
  }
  canEditCard = true
}

function drawRandomCard() {

  const card = draw()

  const availableTiles = placementTiles.filter(tile => !tile.isOccupied);

  let randomIndex = Math.floor(Math.random() * 1000000) % availableTiles.length;
  let placementTile = availableTiles[randomIndex];
  buildings.push(new Building({
    position: {
      x: placementTile.position.x,
      y: placementTile.position.y
    }
  }, card))

  placementTile.isOccupied = true
}