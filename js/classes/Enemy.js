import { waypoints } from "../data/waypoints.js";
import {c} from '../data/canvas.js';


export class Enemy {
  constructor({position = {x: 0, y: 0}}, multiplier) {
    this.position = position
    this.width = 100
    this.height = 100
    this.waypointIndex = 0
    this.speed = 0.5 * multiplier
    this.radius = 40
    this.maxHealth = 20 * multiplier
    this.health = this.maxHealth
    this.reward = Math.round(10 * multiplier)
    this.center = {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2
    }
  }

  draw() {
    // c.fillStyle = 'red'
    // c.fillRect(this.position.x, this.position.y, this.width, this.height)
    c.beginPath()
    c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = 'purple'
    c.fill()
  }

  drawLifeBar() {
    c.fillStyle = 'red'
    c.fillRect(this.position.x, this.position.y -10, 100, 15)

    c.fillStyle = 'green'
    c.fillRect(this.position.x , this.position.y -10, 100* (this.health/this.maxHealth), 15)
  }

  update() {
    this.draw()

    const waypoint = waypoints[this.waypointIndex]
    const yDistance = waypoint.y - this.center.y
    const xDistance = waypoint.x - this.center.x
    let angle = Math.atan2(yDistance, xDistance)

    this.position.x += Math.cos(angle) * this.speed
    this.position.y += Math.sin(angle) * this.speed
    this.center = {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2
    }

    // console.log(Math.sin(angle) * this.speed)
    // console.log(Math.round((yDistance)/(this.speed*10)) , Math.round((xDistance)/(this.speed*10)))
    if (
      Math.abs(Math.round((yDistance))) < this.speed &&
      Math.abs(Math.round((xDistance))) < this.speed &&
      this.waypointIndex < waypoints.length - 1
    ) {
      this.waypointIndex++
    }

  }
}
