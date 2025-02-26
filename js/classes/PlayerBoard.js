import {c} from '../data/canvas.js';
import {config} from '../data/config.js';
import {SummonButton} from './SummonButton.js';
import {CenterButton} from './CenterButton.js';
import {RaiseButton} from './RaiseButton.js';
import {DieButton} from './DieButton.js';

const grid = config.grid

export class PlayerBoard {
  constructor() {
    this.position = {
      x: grid * 1.5,
      y: grid * 4.125
    }
    this.width = grid * 4
    this.height = grid * 1
    this.radius = 10
    this.centerButton = new CenterButton()
    this.raiseButtion = new RaiseButton()
    this.dieButton = new DieButton()
  }

  update(draggingBuilding, mouse, hand, reRollCost, raiseCost) {
    if (draggingBuilding) {
      this.draw()
      this.showPrice()
    } else {
      this.draw()
      this.centerButton.update(mouse, hand, reRollCost)
      this.raiseButtion.update(mouse, hand, raiseCost)
      this.dieButton.update(mouse, hand, reRollCost)
    }
  }

  draw() {
    c.fillStyle = "rgb(0, 128, 64, 0.8)"
    this.drawRoundedRect(c, this.position.x, this.position.y, this.width, this.height, this.radius)
  }

  //extract if required from others
  drawRoundedRect(ctx, x, y, width, height, radius) {
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

  showPrice() {

  }
}