import {ProjectTile} from './ProjectTile.js';
import { config } from "../data/config.js";
import {c} from '../data/canvas.js';

const grid = config.grid

export class Building {

  constructor({position = {x: 0, y: 0}}) {
    this.position = position
    this.width = grid * 0.8
    this.height = grid * 0.95
    this.center = {
      x: this.position.x + grid / 2,
      y: this.position.y + grid / 2
    }
    this.radius = 300
    this.target = undefined
    this.projectTiles = []
    this.frames = 0
    this.attackSpeed = 30
  }

  draw() {
    c.fillStyle = 'blue'
    c.fillRect(
      this.position.x + (grid - this.width) / 2,
      this.position.y + (grid - this.height) / 2, this.width, this.height
    )

    //attack rage
    // c.beginPath()
    // c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
    // c.fillStyle = "rgb(255, 255, 255, 0.3)"
    // c.fill()

  }

  update() {
    this.draw()

    if (this.frames % this.attackSpeed === 0 && this.target) {
      this.projectTiles.push(
        new ProjectTile({
          position: {
            x: this.center.x,
            y: this.center.y
          }
        }, this.target)
      )
    }
    this.frames++
  }
}
