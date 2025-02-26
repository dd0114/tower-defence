import {config} from '../data/config.js';
import {c} from '../data/canvas.js';

const grid = config.grid;

export class CenterButton {
  constructor() {
    this.position = {x: grid * 3, y: grid * 4.125};
    this.size = config.grid;
    this.radius = grid * (5 / 12);
    this.center = {
      x: this.position.x + grid / 2,
      y: this.position.y + grid / 2
    };
  }

  update(mouse, hand, price) {
    this.drawDefault();
    // if (hand.cardList === 0) {
    if (this.isMouseInside(mouse)) {
      this.drawActiveEffect()
    }

    if (hand.isEmpty()) {
      this.drawDefault('black')
      this.fillText("Re-Roll", 5)
      this.showCost(price)
    } else {
      this.drawDefault('red')
      this.fillText(hand.handRankResult.name, 0)
    }
  }

  drawDefault(color) {
    // 🔹 포커칩 배경 (흰색)
    c.fillStyle = "white"; // 🔥 흰색 포커칩
    const thick = grid / 10
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    c.fill();

    // 🔹 포커칩 외곽 테두리 (검정)
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.stroke();

    c.fillStyle = "rgb(0,0,0,0)"; // 🔥 흰색 포커칩
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius - thick / 2, 0, Math.PI * 2);
    c.fill();

    // 🔹 포커칩 점선 테두리 (더 굵게)
    c.strokeStyle = color;
    c.lineWidth = thick;
    c.setLineDash([20, 20]); // 🔥 더 굵은 점선
    c.stroke();
    c.setLineDash([]); // 기본값으로 리셋

    // 🔹 이모지 감싸는 얇은 원 추가
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius - thick, 0, Math.PI * 2);
    c.stroke();
  }

  isMouseInside(mouse) {
    const dx = mouse.x - this.center.x;
    const dy = mouse.y - this.center.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  fillText(text, offset) {
    // 🔹 몬스터 이모지 출력
    c.fillStyle = "black";
    c.font = `bold ${this.radius * 0.3}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(text, this.center.x, this.center.y - offset);
  }

  showCost(cost) {
    const size = this.radius * 0.25;

    c.font = `bold ${size}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";

    // 테두리 색상 설정
    c.lineWidth = size * 0.1; // 테두리 두께
    c.strokeStyle = "black";  // 테두리 색상
    c.strokeText(cost, this.center.x + size / 2, this.center.y + size / 2 * 2);

    // 글씨 색상 설정
    c.fillStyle = "gold";
    c.fillText(cost, this.center.x + size / 2, this.center.y + size / 2 * 2);

    c.fillStyle = "white";
    c.fillText("💰", this.center.x - size / 2, this.center.y + size / 2 * 2);
  }

  drawActiveEffect() {
    c.fillStyle = "rgb(255,255,255,0.5)"; // 🔥 흰색 포커칩
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius + grid / 20, 0, Math.PI * 2);
    c.fill();
  }
}
