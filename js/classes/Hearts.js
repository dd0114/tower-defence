import {c} from '../data/canvas.js';
import {config} from '../data/config.js';

const grid = config.grid;

export class Hearts {

  constructor() {
    this.position = {
      x: grid * 3,
      y: grid * 5.3
    }
    this.life = 3;
  }

  draw() {
    const size = grid * 0.25;

    c.font = `bold ${size}px Changa One`;
    c.textAlign = "right"; // 오른쪽 정렬로 변경
    c.textBaseline = "middle";

    const xPos = this.position.x;

    // 테두리 색상 설정
    c.lineWidth = size * 0.1;
    c.strokeStyle = "black";
    c.strokeText(this.life, xPos, this.position.y);

    // 글씨 색상 설정
    c.fillStyle = "white";
    c.fillText(this.life, xPos, this.position.y);

        c.font = `bold ${size*0.7}px Changa One`;
    c.textAlign = "right"; // 오른쪽 정렬로 변경
    c.textBaseline = "middle";
    c.fillText('❤️', xPos - c.measureText(this.life).width - (size * 0.3), this.position.y+(size * 0.1));
  }

}