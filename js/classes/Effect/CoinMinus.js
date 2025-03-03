import {c} from '../../data/canvas.js';
import {config} from '../../data/config.js';
import {Utils} from '../Util/Utils.js';

export class CoinMinus {
  constructor(position, amount) {
    this.position = position;
    this.amount = amount;
    this.frame = 0;
    this.maxFrame = 300;
    this.alpha = 0;
    this.distance = config.grid / 16
    this.textColor = 'rgb(255, 0,0,0)';
    this.lineColor = 'rgb(0, 0,0, 0)';

    console.log(position)
  }

  update() {
    this.updateAlpha();

    this.draw();
    this.frame++;

    // 점진적으로 상승
    this.position.y += this.distance / this.maxFrame;
  }

  updateAlpha() {
    const fadeInTimePercent = 20;
    const fadeOutTimePercent = 10;
    const endOfFadeInFrame = this.maxFrame * (fadeInTimePercent / 100);
    const startOfFadeOutFrame = this.maxFrame * (100 - fadeOutTimePercent) / 100

    if (this.frame <= endOfFadeInFrame) {
      this.alpha = this.frame / endOfFadeInFrame;
      // 처음 20프레임 동안 페이드인
    } else if (startOfFadeOutFrame <= this.frame) {
      this.alpha = 1 - ((this.frame - startOfFadeOutFrame) / (this.maxFrame - startOfFadeOutFrame))
    } else {
      this.alpha = 1;
    }

    this.textColor = Utils.changeAlpha(this.textColor, this.alpha)
    this.lineColor = Utils.changeAlpha(this.lineColor, this.alpha)
  }

  draw() {
    // c.globalAlpha = this.alpha; // 투명도 적용
    const fontSize = config.fontSize
    c.font = `${fontSize}px Tahoma`;
    c.textAlign = "center";
    c.textBaseline = "middle";

    // 테두리 색상 설정
    c.lineWidth = fontSize * 0.1; // 테두리 두께
    c.strokeStyle = this.lineColor;  // 테두리 색상
    c.strokeText('+' + this.amount, this.position.x, this.position.y);

    // 글씨 색상 설정

    c.fillStyle = this.textColor
    c.fillText('+' + this.amount, this.position.x, this.position.y);
  }

  isEnd() {
    return this.frame >= this.maxFrame;
  }
}
