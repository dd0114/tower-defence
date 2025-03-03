import {c} from '../data/canvas.js';

export class ProjectTile {
  constructor({position = {x: 0, y: 0}}, enemy, projectTileInfo) {
    this.position = position
    this.speed = 5
    this.radius = 10
    this.enemy = enemy
    this.power = 5
    this.velocity = {
      x: 0,
      y: 0
    }
    this.projectTileInfo = projectTileInfo
  }

  getPower() {
    return this.power * (this.projectTileInfo?.power ?? 0.2)
  }

  draw() {
    if (this.projectTileInfo) {
      c.beginPath()
      c.arc(this.position.x, this.position.y, this.radius * this.projectTileInfo.radius, 0, Math.PI * 2)
      c.fillStyle = this.projectTileInfo.color
      c.fill()

    } else {

      c.beginPath()
      c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
      c.fillStyle = 'orange'
      c.fill()
    }
  }

  update() {
    this.draw()

    const angle = Math.atan2(
      this.enemy.center.y - this.position.y,
      this.enemy.center.x - this.position.x
    )

    this.position.x += Math.cos(angle) * this.speed * (this.projectTileInfo?.speed ?? 1)
    this.position.y += Math.sin(angle) * this.speed * (this.projectTileInfo?.speed ?? 1)
  }

  isHitTheEnemy() {
    const xDifference = this.position.x - this.enemy.center.x
    const yDifference = this.position.y - this.enemy.center.y
    const distance = Math.hypot(xDifference, yDifference);

    return distance < (this.radius + this.enemy.radius)
  }

  applyDamage(){
    this.enemy.health -= this.getPower()
  }
}
