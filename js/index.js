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
import {MultiplayerManager} from './multiplayer/MultiplayerManager.js';

const grid = config.grid

canvas.width = grid * config.numOfWidth
canvas.height = grid * config.numOfHeight

const backGround = new Image()
backGround.onload = () => {
  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
}
backGround.src = 'img/backGround.png'

// 멀티플레이어 매니저 초기화
const multiplayerManager = new MultiplayerManager();
const isMultiplayer = true; // 싱글플레이어 모드와 구분

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

// 게임 상태 분리 (멀티플레이어용)
let gameState = {
  enemies: [],
  buildings: [],
  effects: [],
  coins: new Coins(),
  hearts: new Hearts(),
  stage: new Stage()
};

// 렌더링용 상태 (보간된 상태)
let renderState = {
  enemies: [],
  buildings: [],
  effects: []
};

let activeTile = undefined
let isMouseInSummonButton = false

const summonNum = 10

const hand = new Hand()
const deck = new Deck()
let canEditCard = true

let isDragging = false
let mouseDownPos = {x: null, y: null};
let mouseUpPos = {x: null, y: null};
const DRAG_THRESHOLD = 3

let lastTime = 0;

function animate(currentTime = 0) {
  const deltaTime = (currentTime - lastTime) * config.gameSpeed;
  lastTime = currentTime;
  
  const animationId = requestAnimationFrame(animate);

  // 멀티플레이어 모드인 경우 서버 상태 기반으로 렌더링
  if (isMultiplayer && multiplayerManager.isConnected()) {
    updateMultiplayerGame(deltaTime);
  } else {
    updateSinglePlayerGame(deltaTime);
  }

  // 공통 렌더링
  renderGame();
}

function updateMultiplayerGame(deltaTime) {
  // 서버에서 보간된 상태 가져오기
  const interpolatedState = multiplayerManager.getInterpolatedGameState();
  const localState = multiplayerManager.getLocalGameState();
  
  // 렌더링 상태 업데이트
  renderState.enemies = interpolatedState.enemies || [];
  renderState.buildings = Array.from(localState.buildings.values()).flat() || [];
  
  // 로컬 효과 업데이트 (서버와 무관한 시각적 효과)
  updateLocalEffects(deltaTime);
  
  // UI 상태 업데이트
  const playerStats = localState.playerStats[multiplayerManager.playerId];
  if (playerStats) {
    gameState.coins.balance = playerStats.coins;
    gameState.hearts.life = playerStats.hearts;
    gameState.stage.round = playerStats.stage || 1;
  }
}

function updateSinglePlayerGame(deltaTime) {
  // 기존 싱글플레이어 로직
  playerBoard.update(pickedBuilding, mouse, hand, getReRollCost(), getRaiseCost())
  
  if (gameState.enemies.length === 0) {
    gameState.stage.round += 1
    const multiplier = 1 + ((1 / 5) * (gameState.stage.round - 1))
    const monsterNum = (summonNum * multiplier)

    const icon = Enemy.selectIcon();
    for (let i = 1; i < monsterNum + 1; i++) {
      const yOffset = (i * grid * summonNum) / monsterNum
      gameState.enemies.push(
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

  updateEnemies(deltaTime);
  updateBuildings(deltaTime);
  updateLocalEffects(deltaTime);
  
  // 렌더링 상태 = 게임 상태
  renderState = gameState;
}

function updateEnemies(deltaTime) {
  for (let i = gameState.enemies.length - 1; 0 <= i; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(deltaTime)

    if (enemy.waypointIndex === waypoints.length - 1 && enemy.position.y > canvas.height) {
      gameState.hearts.life -= 1
      gameState.enemies.splice(i, 1)
      if (gameState.hearts.life === 0) {
        console.log("game over")
        document.querySelector('#gameOver').style.display = 'flex'
      }
    }
  }
}

function updateBuildings(deltaTime) {
  gameState.buildings.forEach((building => {

    building.target = null;

    const validEnemies = gameState.enemies.map((enemy) => {
      const xDiff = enemy.center.x - building.center.x;
      const yDiff = enemy.center.y - building.center.y;
      const distance = Math.hypot(xDiff, yDiff);

      return {enemy, distance};
    }).filter(({enemy, distance}) => distance < enemy.radius + building.getRadius() && enemy.isInBoard()).sort((a, b) => a.distance - b.distance)

    const n = 1;
    building.target = validEnemies.slice(0, n).map((item) => item.enemy)[0];

    if (!building.isPicked) {
      building.update(mouse, deltaTime)
    }

    for (let i = building.projectTiles.length - 1; 0 <= i; i--) {
      const tile = building.projectTiles[i]
      tile.update(deltaTime)

      if (tile.isHitTheEnemy()) {
        tile.applyDamage()

        const tileEnemy = tile.enemy;
        if (tileEnemy.health <= 0 && tileEnemy.isDeath === false) {
          tileEnemy.isDeath = true
          const index = gameState.enemies.findIndex((enemy) => {
            return tileEnemy === enemy
          });

          if (index > -1) {
            let income = tileEnemy.reward;
            gameState.coins.balance += income
            gameState.enemies.splice(index, 1)
            gameState.effects.push(new CoinPlus(tileEnemy.center, income))
          }
        }
        building.projectTiles.splice(i, 1)
      }
    }
  }))
}

function updateLocalEffects(deltaTime) {
  for (let i = gameState.effects.length - 1; 0 <= i; i--) {
    let effect = gameState.effects[i];
    effect.update(deltaTime)
    if (effect.isEnd()) {
      gameState.effects.splice(i, 1)
    }
  }
}

function renderGame() {
  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
  drawGrid()
  
  if (!isMultiplayer) {
    playerBoard.update(pickedBuilding, mouse, hand, getReRollCost(), getRaiseCost())
  }
  
  gameState.coins.draw()
  gameState.hearts.draw()
  gameState.stage.draw()
  
  // 적 렌더링
  renderState.enemies.forEach(enemy => {
    if (enemy.draw) enemy.draw();
    if (enemy.drawLifeBar) enemy.drawLifeBar();
  });
  
  // 건물 렌더링
  renderState.buildings.forEach(building => {
    if (building.draw) building.draw();
  });
  
  // 효과 렌더링
  gameState.effects.forEach(effect => {
    if (effect.draw) effect.draw();
  });

  // 드래그된 빌딩 그리기
  if (pickedBuilding) {
    pickedBuilding.drawDragging(mouse.x, mouse.y)
  }
  
  // 멀티플레이어 UI
  if (isMultiplayer && multiplayerManager.isConnected()) {
    drawMultiplayerUI();
  }
}

function drawMultiplayerUI() {
  // Ping 표시
  c.fillStyle = 'white';
  c.font = '16px Arial';
  c.fillText(`Ping: ${multiplayerManager.getPing()}ms`, 10, 30);
  
  // 연결 상태
  c.fillText('Connected', 10, 50);
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
  if (gameState.buildings.length < 11 && hand.isEmpty() && isMouseInSummonButton && !pickedBuilding && gameState.coins.balance >= cardCost && canEditCard) {
    // reRoll
    reRoll()

    const {x, y} = playerBoard.centerButton.center;
    gameState.effects.push(new CoinMinus({x, y}, cardCost))
    return;
  }

  const raiseCost = getRaiseCost()

  if (gameState.buildings.length < 15 && !pickedBuilding && !hand.isEmpty() && playerBoard.raiseButtion.isMouseInside(mouse) && gameState.coins.balance >= raiseCost && canEditCard) {
    // raise
    gameState.coins.balance -= raiseCost
    drawRandomCard()
    const {x, y} = playerBoard.raiseButtion.center;
    gameState.effects.push(new CoinMinus({x, y}, raiseCost))
    return;
  }

  if (!pickedBuilding && hand.handRankResult && canEditCard && hand.cardList.length > 0) {

    //기물 소환
    if (playerBoard.centerButton.isMouseInside(mouse)) {
      canEditCard = false

      const handRankResult = {...hand.handRankResult}

      for (let i = gameState.buildings.length - 1; 0 <= i; i--) {
        // 빌딩 순회
        let building = gameState.buildings[i];
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

      for (let i = gameState.buildings.length - 1; 0 <= i; i--) {
        // 빌딩 순회
        let building = gameState.buildings[i];
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
      for (let i = gameState.buildings.length - 1; 0 <= i; i--) {
        if (pickedBuilding === null) {
          let building = gameState.buildings[i];
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

// 게임 속도 조정 함수
function setGameSpeed(speed) {
  config.gameSpeed = speed;
}

// 전역으로 노출 (콘솔에서 테스트 가능)
window.setGameSpeed = setGameSpeed;

animate()

function isInObject(position, object) {
  if (!position || !object) {
    return false
  }

  return object.position.x < position.x && position.x < object.position.x + object.width
         && object.position.y < position.y && position.y < object.position.y + object.height
}

function getReRollCost() {
  return cardPrice * (1 + gameState.buildings.filter((building) => {
    return building.rankTower
  }).length)
}

function getRaiseCost() {
  const numOfCard = gameState.buildings.filter((building) => {
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
    gameState.coins.balance += building.getSellingMultiplier() * getReRollCost()
  }

  let index = gameState.buildings.findIndex(b => b.position.x === building.position.x && b.position.y === building.position.y);
  gameState.buildings.splice(index, 1)

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
  gameState.coins.balance -= getReRollCost()
  gameState.buildings.push(new Building({
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
  gameState.coins.balance -= getReRollCost()

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
  gameState.buildings.push(new Building({
    position: {
      x: placementTile.position.x,
      y: placementTile.position.y
    }
  }, card))

  placementTile.isOccupied = true
}