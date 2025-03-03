import {waypoints} from "../data/waypoints.js";
import {c} from '../data/canvas.js';
import {config} from '../data/config.js';

export class Enemy {
  constructor({position = {x: 0, y: 0}}, multiplier, icon) {
    this.position = position
    this.width = 100
    this.height = 100
    this.waypointIndex = 0
    this.speed = 0.5 * multiplier
    this.radius = 40
    this.maxHealth = 20 * multiplier
    this.health = this.maxHealth
    this.reward = Math.round(5 * multiplier)
    this.center = {
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2
    }
    this.icon = icon
    this.isDeath = false
  }

  draw() {
    // c.fillStyle = 'red'
    // c.fillRect(this.position.x, this.position.y, this.width, this.height)
    c.beginPath()
    c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2)
    c.fillStyle = 'purple'
    c.fill()
  }

  drawIcon() {
    c.font = `bold ${this.radius * 2}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";

    c.fillStyle = "gold";
    c.fillText(this.icon, this.center.x, this.center.y);
  }

  drawLifeBar() {
    const barSize = config.grid * 0.8;
    const barHeight = 15;
    const x = this.center.x - barSize / 2;
    const y = this.position.y - 13;

    // 배경 (빨간색 바)
    c.fillStyle = 'black';
    c.fillRect(x, y, barSize, barHeight);

    // 초록색 라이프바
    const lifeWidth = barSize * (this.health / this.maxHealth);
    c.fillStyle = 'green';
    c.fillRect(x, y, lifeWidth, barHeight);

    // 검은색 테두리
    c.strokeStyle = 'black';
    c.lineWidth = 2;
    c.strokeRect(x, y, barSize, barHeight);

    // 라이프 간격 표시 (세로선)
    const dw = 5;
    const segments = this.maxHealth / dw;
    const segmentWidth = barSize / segments;

    // 굵은 선 (5 단위)
    c.strokeStyle = 'black';
    c.lineWidth = 2;

    for (let i = 1; i < segments; i++) {
      const segmentX = x + i * segmentWidth;
      c.beginPath();
      c.moveTo(segmentX, y);  // 위에서 시작
      c.lineTo(segmentX, y+barHeight); // 절반까지만 그림
      c.stroke();
    }

    // 더 얇은 선 (1 단위)
    const thinSegments = this.maxHealth; // 1 단위로 나눔
    const thinSegmentWidth = barSize / thinSegments;

    c.strokeStyle = 'black';
    c.lineWidth = 1;

    for (let i = 1; i < thinSegments; i++) {
      if (i % dw === 0) {
        continue;
      } // 5 단위(굵은 선) 위치는 건너뜀
      const thinSegmentX = x + i * thinSegmentWidth;
      c.beginPath();
      c.moveTo(thinSegmentX, y);
      c.lineTo(thinSegmentX, y + barHeight/2);
      c.stroke();
    }

  }

  update() {
    // this.draw()
    this.drawIcon()

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

    if (
      Math.abs(Math.round((yDistance))) < this.speed &&
      Math.abs(Math.round((xDistance))) < this.speed &&
      this.waypointIndex < waypoints.length - 1
    ) {
      this.waypointIndex++
    }

  }

  isInBoard() {
    return (this.center.y - this.radius) < config.grid * config.numOfHeight
  }

  static iconList = ['👾', '👻', '🐙', '⛄', '🦠', '🪆', '🌝', '🐣', '🐥', '🪼', '🦦'];

  static selectIcon() {
    const index = Math.floor((Math.random() * 100000) % this.iconList.length);
    return this.iconList[index];
  }
}
