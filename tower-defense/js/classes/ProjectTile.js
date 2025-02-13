import {c} from '../data/canvas.js';

export class ProjectTile {
  constructor({position = {x: 0, y: 0}}, enemy) {
    this.position = position
    this.speed = 10
    this.radius = 10
    this.enemy = enemy
    this.power = 10
    this.velocity = {
      x: 0,
      y: 0
    }
  }

  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = 'orange'
    c.fill()
  }

  update() {
    this.draw()

    const angle = Math.atan2(
      this.enemy.center.y - this.position.y,
      this.enemy.center.x - this.position.x
    )

    this.position.x += Math.cos(angle) * this.speed
    this.position.y += Math.sin(angle) * this.speed
  }
}
