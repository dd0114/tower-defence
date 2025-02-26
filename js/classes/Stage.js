import {c} from '../data/canvas.js';
import {config} from '../data/config.js';

const grid = config.grid;

export class Stage {

  constructor() {
    this.position = {
      x: grid * 2.3,
      y: grid * 5.3
    }
    this.round = 0;
  }

  draw() {
    const size = grid * 0.25;

    c.font = `bold ${size}px Changa One`;
    c.textAlign = "right"; // 오른쪽 정렬로 변경
    c.textBaseline = "middle";

    const xPos = this.position.x;

    // 테두리 색상 설정
    c.lineWidth = size * 0.08;
    c.strokeStyle = "white";
    c.strokeText(this.round, xPos, this.position.y);

    // 글씨 색상 설정
    c.fillStyle = "black";
    c.fillText(this.round, xPos, this.position.y);

    c.font = `bold ${size*0.7}px Changa One`;
    // 이모지를 항상 왼쪽에 고정해서 그려줌 (텍스트 길이 따라 위치 변경)
    c.fillText('STAGE', xPos - c.measureText(this.round).width - (size * 0.3), this.position.y+(size * 0.05));

    c.lineWidth = size * 0.01;
    c.strokeStyle = "white";
    c.strokeText('STAGE', xPos - c.measureText(this.round).width - (size * 0.3), this.position.y+(size * 0.05));

  }

}