import {c} from '../data/canvas.js';

export class Sprite{
  constructor({position = {x : 0, y:0}, imageSrc, frames = { max : 1}}) {
    this.position = position
    this.image = new Image()
    this.image.src = imageSrc
    this.frames = {
      max: frames.max,
      current: 0,
      elapsed: 0,
      hold: 3
    }
  }

  draw(){
    const cropWidth = this.image.width / this.frames.max
    const crop = {
      position : {
        x: cropWidth * this.frames.current,
        y: 0
      },
      width: cropWidth,
      height: this.image.height
    }
    console.log("이미지 로드 완료:", this.image.width, this.image.height);

    c.drawImage(
      this.image,
      crop.position.x,
      crop.position.y,
      crop.width,
      crop.height,
      this.position.x,
      this.position.y,
      crop.width,
      crop.height
    )
  }
}