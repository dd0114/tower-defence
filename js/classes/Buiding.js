import {ProjectTile} from './ProjectTile.js';
import {config} from "../data/config.js";
import {c} from '../data/canvas.js';
import {Card} from "./Card.js";
import {Sprite} from './Sprite.js';

const grid = config.grid

export class Building {

  constructor({position = {x: 0, y: 0}}, card) {
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
    this.elapsedSpawnTime = 0
    this.attackSpeed = 30
    this.card = card

    console.log(card)
  }

draw() {
    // 🔹 카드 배경 (흰색)
    c.fillStyle = "white";
    c.fillRect(
      this.position.x + (grid - this.width) / 2,
      this.position.y + (grid - this.height) / 2,
      this.width,
      this.height
    );

    // 🔹 Suit (문양) 및 Rank (숫자/문자 변환)
    const suits = ["", "♠", "♥", "♦", "♣"];
    const colors = ["", "black", "red", "red", "black"]; // ♠♣ 검정, ♥♦ 빨강
    const ranks = { 11: "J", 12: "Q", 13: "K", 14: "A" };

    const suit = suits[this.card.suit]; // 숫자 → 문양 변환
    const rank = ranks[this.card.rank] || this.card.rank; // 숫자 → JQKA 변환
    const textColor = colors[this.card.suit]; // 검정/빨강 색상 선택

    // 🔹 폰트 스타일 변경 (Google Fonts 적용)
    c.fillStyle = textColor;
    c.font = `bold ${grid * 0.35}px "Changa One", "Noto Sans", sans-serif`; // ✅ Google Fonts 적용
    c.textAlign = "center";
    c.textBaseline = "middle";

    // 🔹 숫자 (상단)
    c.fillText(rank, this.center.x, this.position.y + grid * 0.3);

    // 🔹 문양 (중앙)
    c.font = `bold ${grid * 0.35}px "Changa One", "Noto Sans", sans-serif`; // ✅ 문양도 적용
    c.fillText(suit, this.center.x, this.center.y+ grid * 0.15);
  }

  update() {
    this.draw()

    if (this.elapsedSpawnTime % this.attackSpeed === 0 && this.target) {
      this.projectTiles.push(
        new ProjectTile({
          position: {
            x: this.center.x,
            y: this.center.y
          }
        }, this.target)
      )
    }
    this.elapsedSpawnTime++
  }
}
