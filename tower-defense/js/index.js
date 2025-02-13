import {Building} from './classes/Buiding.js';
import {Enemy} from './classes/Enemy.js';
import {PlacementTile} from './classes/PlacementTile.js';
import {ProjectTile} from './classes/ProjectTile.js';
import {config} from './data/config.js';
import {placementTilesData} from './data/placementTilesData.js';
import {waypoints} from './data/waypoints.js';
import {canvas, c} from './data/canvas.js';

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

let hearts = 3;
let coins = 100;

let roundCount = 0
const summonNum = 10

function animate() {
  const animationId = requestAnimationFrame(animate);

  c.drawImage(backGround, 0, 0, canvas.width, canvas.height)
  drawGrid()
  drawPlayerBoard()

  if (enemies.length === 0) {
    roundCount +=1
    const monsterNum = summonNum * (1 + (roundCount -1)/2)

    for (let i = 1; i < monsterNum +1 ; i++) {
      const yOffset = (i * grid * summonNum)/monsterNum
      console.log(yOffset)
      enemies.push(
        new Enemy({
          position: {
            x: waypoints[0].x,
            y: waypoints[0].y + yOffset
          }
        })
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

  for (let i = enemies.length-1; 0<= i; i--){
    enemies[i].drawLifeBar()
  }

  placementTiles.forEach((tile => {
    tile.update(mouse)
  }))

  buildings.forEach((building => {

    building.target = null

    const validEnemies = enemies.filter((enemy) => {
      const xDiff = enemy.center.x - building.center.x
      const yDiff = enemy.center.y - building.center.y
      const distance = Math.hypot(xDiff, yDiff)
      return distance < enemy.radius + building.radius
    })

    building.target = validEnemies[0]

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
        tile.enemy.health -= tile.power
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
  }))

}

const mouse = {
  x: undefined,
  y: undefined
}

let cardPrice = 50

canvas.addEventListener('click', (event) => {
  if (activeTile && !activeTile.isOccupied && coins >= cardPrice) {
    buildings.push(new Building({
      position: {
        x: activeTile.position.x,
        y: activeTile.position.y
      }
    }))
    activeTile.isOccupied = true
    coins -= cardPrice
    document.querySelector('#coins').innerHTML = coins
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

    // console.log(activeTile)
  }
)

animate()