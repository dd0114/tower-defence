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

const grid = config.grid

canvas.width = grid * config.numOfWidth
canvas.height = grid * config.numOfHeight

const backGround = new Image()
backGround.onload = () => {
  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
}
backGround.src = 'img/backGround.png'

function drawPlayerBoard() {
  c.fillStyle = "rgb(0, 128, 64, 0.8)"
  drawRoundedRect(c, grid * 1.5, grid * 4, grid * 4, grid * 1, 10)
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, 0);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5);
  ctx.lineTo(x + radius, y + height);
  ctx.arc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI);
  ctx.lineTo(x, y + radius);
  ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
  ctx.closePath();
  ctx.fill();
}

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
  c.strokeStyle = '#90EE90';
  c.lineWidth = 2;

  for (let x = 0; x <= canvas.width; x += grid) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, canvas.height);
    c.stroke();
  }

  for (let y = 0; y <= canvas.height; y += grid) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(canvas.width, y);
    c.stroke();
  }
}

const enemies = []
const buildings = []
let activeTile = undefined
let isMouseInSummonButton = false

let hearts = 3;
let coins = 100;

let roundCount = 0
const summonNum = 10

const hand = new Hand()
const deck = new Deck()
let canEditCard = true

function animate() {
  const animationId = requestAnimationFrame(animate);

  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
  drawGrid()
  drawPlayerBoard()

  if (enemies.length === 0) {
    roundCount += 1
    const monsterNum = summonNum * (1 + (roundCount - 1) / 2)

    for (let i = 1; i < monsterNum + 1; i++) {
      const yOffset = (i * grid * summonNum) / monsterNum
      enemies.push(
        new Enemy({
          position: {
            x: waypoints[0].x,
            y: waypoints[0].y + yOffset
          }
        }, 1 + (1 / 2 * (roundCount - 1))
        )
      )
    }
  }

  for (let i = enemies.length - 1; 0 <= i; i--) {
    const enemy = enemies[i];
    enemy.update()
    if (enemy.waypointIndex === waypoints.length - 1 && enemy.position.y > canvas.height) {
      hearts -= 1
      enemies.splice(i, 1)
      document.querySelector('#hearts').innerHTML = hearts
      if (hearts === 0) {
        console.log("game over")
        cancelAnimationFrame(animationId)
        document.querySelector('#gameOver').style.display = 'flex'
      }
    }
  }

  for (let i = enemies.length - 1; 0 <= i; i--) {
    enemies[i].drawLifeBar()
  }

  placementTiles.forEach((tile => {
    tile.update(mouse)
  }))

  summonButton.update(mouse, hand.handRankResult)

  buildings.forEach((building => {

    building.target = null

    const validEnemies = enemies.filter((enemy) => {
      const xDiff = enemy.center.x - building.center.x
      const yDiff = enemy.center.y - building.center.y
      const distance = Math.hypot(xDiff, yDiff)

      return distance < enemy.radius + building.getRadius()
    })

    building.target = validEnemies[0]

    if (building.rankTower && building.rankTower.rankName === HandRank.FULL_HOUSE){
      console.log(building.target)
      console.log(validEnemies)
    }

    building.update()

    for (let i = building.projectTiles.length - 1; 0 <= i; i--) {

      const tile = building.projectTiles[i]
      tile.update()

      const xDifference = tile.position.x - tile.enemy.center.x
      const yDifference = tile.position.y - tile.enemy.center.y
      const distance = Math.hypot(xDifference, yDifference);
      // console.log(distance < (tile.radius + tile.enemy.radius))

      //when hit the enemy
      if (distance < (tile.radius + tile.enemy.radius)) {
        tile.enemy.health -= tile.getPower()
        if (tile.enemy.health <= 0) {
          const index = enemies.findIndex((enemy) => {
            return tile.enemy === enemy
          });

          if (index > -1) {
            coins += tile.enemy.reward
            enemies.splice(index, 1)
            document.querySelector('#coins').innerHTML = coins
          }
        }
        building.projectTiles.splice(i, 1)
      }

    }

    //소환 버튼에 갔을때 나머지 비활성화
    if (summonButton.isMouseInside(mouse) && hand.handRankResult) {
      let isInHanRank = false
      hand.handRankResult.usedCards.forEach((card) => {
          if (building.card && card.equal(building.card)) {
            isInHanRank = true
          }
        }
      )
      if (!isInHanRank) {
        building.deActivate()
      }
    }
  }))

}

const mouse = {
  x: undefined,
  y: undefined
}

let cardPrice = 1

window.addEventListener('click', (event) => {
  cardPrice = 2 ** buildings.length;
  if (activeTile && !activeTile.isOccupied && coins >= cardPrice && canEditCard) {
    // 카드뽑기
    canEditCard = false
    let card = deck.draw();
    hand.addCard(card);
    canEditCard = true

    buildings.push(new Building({
      position: {
        x: activeTile.position.x,
        y: activeTile.position.y
      }
    }, card))

    activeTile.isOccupied = true
    coins -= cardPrice
    document.querySelector('#coins').innerHTML = coins

    // console.log(hand)
    // console.log(Building)
  }

  if (isMouseInSummonButton && hand.handRankResult && canEditCard) {
    //기물 소환
    canEditCard = false

    for (let i = buildings.length - 1; 0 <= i; i--) {
      // 빌딩 순회
      let building = buildings[i];
      let buildingCard = building.card;
      if (buildingCard) {
        hand.handRankResult.usedCards.forEach((card) => {
            // 빌딩카드가 족보에 쓰일경우
            if (buildingCard.equal(card)) {
              // 가장 탑일경우 타워설치
              if (buildingCard.equal(hand.handRankResult.topCards[0])) {
                console.log(hand.handRankResult.name)
                building.rankTower = new RankTower(hand.handRankResult.name, hand.handRankResult.topCards)
                building.card = null
              } else {
                //아닐경우 제거
                buildings.splice(i, 1)
                placementTiles.forEach((tile) => {
                  if (tile.position.x === building.position.x && tile.position.y === building.position.y) {
                    tile.isOccupied = false
                  }
                })
              }
            }
          }
        )
      }
    }

    const cardsToBeStash = [...hand.handRankResult.usedCards]
    cardsToBeStash.forEach((card) => {
        hand.removeCard(card)
        deck.trash(card)
      }
    )
    canEditCard = true
  }
  // console.log(buildings)
})

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY

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

    // console.log(activeTile)
  }
)

animate()