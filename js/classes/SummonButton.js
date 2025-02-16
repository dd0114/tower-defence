import {config} from '../data/config.js';
import {c} from '../data/canvas.js';

const grid = config.grid;

export class SummonButton {
  constructor() {
    this.position = {x: grid * 3, y: grid * 4};
    this.size = config.grid;
    this.radius = grid / 2;
    this.center = {
      x: this.position.x + grid / 2,
      y: this.position.y + grid / 2
    };
  }

  drawDefault() {
    // 🔹 포커칩 배경 (흰색)
    c.fillStyle = "white"; // 🔥 흰색 포커칩
    const thick = 15
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius - thick, 0, Math.PI * 2);
    c.fill();

    // 🔹 포커칩 외곽 테두리 (검정)
    c.strokeStyle = "black";
    c.lineWidth = 3;
    c.stroke();

    // 🔹 포커칩 점선 테두리 (더 굵게)
    c.strokeStyle = "black";
    c.lineWidth = thick;
    c.setLineDash([20, 10]); // 🔥 더 굵은 점선
    c.stroke();
    c.setLineDash([]); // 기본값으로 리셋

    // 🔹 중앙 몬스터 이모지 추가 (👹, 👻, 🧟, 💀 중 랜덤)
    // const monsterIcons = ["👹", "👻", "🧟", "💀"];
    // const monster = monsterIcons[Math.floor(Math.random() * monsterIcons.length)];

    // 🔹 이모지 감싸는 얇은 원 추가
    c.strokeStyle = "black";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius * 0.6, 0, Math.PI * 2);
    c.stroke();
  }

  drawActive(handResult) {
    // 🔹 반투명한 원형 배경
    c.fillStyle = "rgba(255, 255, 255, 0.5)";
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    c.fill();

    // 🔹 테두리 색상 설정 (족보 여부에 따라 변경)
    c.strokeStyle = handResult ? "limegreen" : "red";
    c.lineWidth = 5;
    c.beginPath();
    c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    c.stroke();

    // 🔹 족보 여부에 따라 텍스트 출력
    c.fillStyle = handResult ? "black" : "red";
    c.font = `bold ${grid * 0.2}px Arial`;
    c.textAlign = "center";
    c.fillText(handResult ? handResult.name : "No Rank", this.center.x, this.center.y);
  }

  isMouseInside(mouse) {
    const dx = mouse.x - this.center.x;
    const dy = mouse.y - this.center.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  update(mouse, handResult) {
    this.drawDefault();
    if (this.isMouseInside(mouse)) {
      this.drawActive(handResult);
    } else {
      this.drawMonster()
    }
  }

  drawMonster() {
    // 🔹 몬스터 이모지 출력
    const monster = "👾";
    c.fillStyle = "black";
    c.font = `bold ${this.radius * 0.8}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(monster, this.center.x, this.center.y);
  }
}
