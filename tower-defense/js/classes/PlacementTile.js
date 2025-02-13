import { config } from "../data/config.js";

import {c} from '../data/canvas.js';

export class PlacementTile {
  constructor({position = {x: 0, y: 0}}) {
    this.position = position
    this.size = config.grid
    this.color = "rgb(255, 255, 255, 0.3)"
    this.isOccupied = false
  }

  draw() {
    c.fillStyle = this.color
    c.fillRect(this.position.x, this.position.y, this.size, this.size)
  }

  update(mouse) {

    if (
      this.position.x < mouse.x && mouse.x < this.position.x + this.size
      && this.position.y < mouse.y && mouse.y < this.position.y + this.size
    ) {
      this.draw()
    }
  }
}
