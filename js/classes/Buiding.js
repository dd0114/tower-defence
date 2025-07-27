import {ProjectTile} from './ProjectTile.js';
import {config} from "../data/config.js";
import {c} from '../data/canvas.js';
import {handRankInfoMap} from '../data/handRankMap.js';
import {Card} from "./Card.js";
import {Sprite} from './Sprite.js';
import {HandRank} from '../enums/handRank.js';

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
    this.range = config.grid * 3
    this.target = undefined
    this.projectTiles = []
    this.elapsedSpawnTime = 0
    this.attackSpeed = 100
    this.card = card
    this.rankTower = null
    this.isPicked = null
  }

  getRadius() {

    return this.range * (handRankInfoMap[this.rankTower?.rankName]?.projectTile?.range ?? 1);
  }

  draw(mouseX, mouseY) {
    // 🔹 Suit (문양) 및 Rank (숫자/문자 변환)
    const suits = ["♠", "♥", "♦", "♣"];
    const colors = ["black", "red", "red", "black"]; // ♠♣ 검정, ♥♦ 빨강
    const ranks = {11: "J", 12: "Q", 13: "K", 14: "A"};

    const centerX = mouseX ?? this.center.x
    const centerY = mouseY ?? this.center.y
    const positionX = centerX - grid / 2
    const positionY = centerY - grid / 2

    if (this.rankTower) {

      const colors = ["black", "rgba(139, 0, 0, 1)", "rgba(139, 0, 0, 1)", "black"]; // ♠♣ 검정, ♥♦ 빨강
      let handRankInfo = handRankInfoMap[this.rankTower.rankName];

      let topCard = this.rankTower.topCards[0];
      const suit = suits[topCard.suit]; // 숫자 → 문양 변환
      const rank = ranks[topCard.rank] || topCard.rank; // 숫자 → JQKA 변환
      const textColor = colors[topCard.suit]; // 검정/빨강 색상 선택

      const borderThickness = handRankInfo.view.lineThick; // 테두리 두께
      const halfBorder = borderThickness / 2; // 테두리 절반

      const x = positionX + (grid - this.width) / 2;
      const y = positionY + (grid - this.height) / 2;
      const w = this.width - borderThickness;
      const h = this.height - borderThickness;

      // 🔹 카드 배경 (흰색)
      c.fillStyle = "rgb(0,0,0, 0.5)";
      c.fillRect(x, y, this.width, this.height);

      // 🔹 카드 테두리 (내부로 조정)
      c.lineWidth = borderThickness;
      c.strokeStyle = handRankInfo.view.lineColor;
      c.strokeRect(x + halfBorder, y + halfBorder, w, h);

      // 🔹 폰트 스타일 변경 (Google Fonts 적용)
      c.fillStyle = textColor;
      c.font = `bold ${grid * 0.25}px "Changa One", "Noto Sans", sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";

      // 🔹 숫자 (상단)
      c.fillText(rank, centerX - grid * 0.1, positionY + grid * 0.75);

      // 🔹 문양 (중앙)
      c.font = `bold ${grid * 0.3}px "Changa One", "Noto Sans", sans-serif`;
      c.fillText(suit, centerX + grid * 0.1, positionY + grid * 0.75);

      // 🔹 아이콘
      c.fillStyle = "black";
      c.font = `bold ${grid * 0.5}px Arial`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(handRankInfo.view.icon, centerX, centerY - grid * 0.1);
    }

    if (this.card) {

      const suit = suits[this.card.suit]; // 숫자 → 문양 변환
      const rank = ranks[this.card.rank] || this.card.rank; // 숫자 → JQKA 변환
      const textColor = colors[this.card.suit]; // 검정/빨강 색상 선택

      // 🔹 카드 배경 (흰색)
      c.fillStyle = "white";
      c.fillRect(
        positionX + (grid - this.width) / 2,
        positionY + (grid - this.height) / 2,
        this.width,
        this.height
      );

      // 🔹 폰트 스타일 변경 (Google Fonts 적용)
      c.fillStyle = textColor;
      c.font = `bold ${grid * 0.35}px "Changa One", "Noto Sans", sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";

      // 🔹 숫자 (상단)
      c.fillText(rank, centerX, positionY + grid * 0.3);

      // 🔹 문양 (중앙)
      c.font = `bold ${grid * 0.35}px "Changa One", "Noto Sans", sans-serif`;
      c.fillText(suit, centerX, centerY + grid * 0.15);
    }

  }

  getSellingMultiplier() {
    if (this.rankTower) {

      let handRankInfo = handRankInfoMap[this.rankTower.rankName];
      return handRankInfo.sellingMultiplier
    }

    return 0;
  }

  drawDragging(mouseX, mouseY) {
    this.draw(mouseX, mouseY)

    let positionX = mouseX - grid / 2
    let positionY = mouseY - grid / 2
    c.fillStyle = "rgb(255, 255, 255, 0.7)";
    c.fillRect(
      mouseX - this.width / 2,
      mouseY - this.height / 2,
      this.width,
      this.height
    );

  }

  update(mouse, deltaTime = 16.67) {
    this.draw()
    if (this.isMouseIn(mouse)) {
      this.drawActiveEffect()
    }

    //shoot
    let spawnMultiplier = 1
    let projectTileInfo = null
    if (this.rankTower) {
      const handRankInfo = handRankInfoMap[this.rankTower.rankName];
      spawnMultiplier = handRankInfo.projectTile.spawnTime
      projectTileInfo = handRankInfo.projectTile

    }

    // deltaTime 기반 타이머 (60fps 기준으로 정규화)
    this.elapsedSpawnTime += deltaTime / 16.67
    
    if (this.elapsedSpawnTime >= Math.floor(this.attackSpeed / spawnMultiplier) && this.target) {
      this.projectTiles.push(
        new ProjectTile({
            position: {
              x: this.center.x,
              y: this.center.y
            }
          }, this.target
          , projectTileInfo)
      )
      this.elapsedSpawnTime = 0
    }
  }

  deActivate() {
    c.fillStyle = "rgba(0, 0, 0, 0.7)";
    c.fillRect(
      this.position.x,
      this.position.y,
      grid,
      grid
    );
  }

  isMouseIn(mouse) {
    return this.position.x < mouse.x && mouse.x < this.position.x + this.width
           && this.position.y < mouse.y && mouse.y < this.position.y + this.height
  }

  drawActiveEffect() {
    c.fillStyle = 'rgb(255,255,255,0.3)'
    c.fillRect(this.position.x, this.position.y, grid, grid)
  }
}
