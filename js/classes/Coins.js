import {c} from '../data/canvas.js';
import {config} from '../data/config.js';

const grid = config.grid;

export class Coins {

  constructor() {
    this.position = {
      x: grid * 3.8,
      y: grid * 5.3
    }
    this.balance = 50;
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
    c.strokeText(this.balance, xPos, this.position.y);

    // 글씨 색상 설정
    c.fillStyle = "white";
    c.fillText(this.balance, xPos, this.position.y);

    // 이모지를 항상 왼쪽에 고정해서 그려줌 (텍스트 길이 따라 위치 변경)

    c.font = `bold ${size * (0.8)}px Changa One`;
    c.fillText('💰', xPos - c.measureText(this.balance).width - (size * 0.4), this.position.y + (size * 0.03));
  }

}