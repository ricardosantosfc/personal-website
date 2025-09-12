import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})

export class Game {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  score = 0;
  ctx!: CanvasRenderingContext2D | null;
  width = 0;
  height = 0;
  private duckImg = new Image();
  private obstacleImg = new Image();
  private currDuckPosY = 0;
  private initialDuckPosY = 0;


  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'w' || event.key == 'a') {
      console.log(this.initialDuckPosY + " " + this.currDuckPosY);
      this.moveDuck();
    }
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    const dpi = window.devicePixelRatio || 1;

    // Get wrapper size — from the parent element!
    const parent = canvas.parentElement!;
    const parentRect = parent.getBoundingClientRect();
    this.width = parentRect.width;
    this.height = parentRect.height;

    // Set canvas internal resolution
    canvas.width = this.width * dpi;
    canvas.height = this.height * dpi;

    // Scale drawing context
    ctx?.scale(dpi, dpi);

    // Background for testing
    canvas.style.background = '#2C2A2A';

    if (ctx) {
      this.ctx = ctx;
      this.drawLanes(this.width, this.height);
      this.duckImg.onload = () => {
        const iw = this.duckImg.naturalWidth;
        const ih = this.duckImg.naturalHeight;
        this.initialDuckPosY = (this.height - ih) / 2;
        this.currDuckPosY = this.initialDuckPosY;
        this.ctx!.drawImage(this.duckImg, 10, this.currDuckPosY, iw, ih);
      };
      this.duckImg.src = 'duck.svg';

    }
  }

  drawLanes(width: number, height: number) {
    const midY1 = height / 2 - 28;
    const midY2 = height / 2 + 28;

    this.ctx!.lineWidth = 10;
    this.ctx!.strokeStyle = "#3D6082";

    this.ctx!.beginPath();
    this.ctx!.moveTo(0, midY1);
    this.ctx!.lineTo(width, midY1);
    this.ctx!.stroke();

    this.ctx!.beginPath();
    this.ctx!.moveTo(0, midY2);
    this.ctx!.lineTo(width, midY2);
    this.ctx!.stroke();

  }

  drawDuck(width: number, height: number, posY: number) {


  }

  moveDuck() {
    this.ctx!.clearRect(0, 0, this.width, this.height);

    this.drawLanes(this.width, this.height);

    if (this.currDuckPosY === this.initialDuckPosY) {
      console.log("1");
      this.currDuckPosY -= 56;
      this.ctx!.drawImage(this.duckImg, 10, this.currDuckPosY);
    } else {
      console.log("2");
      this.currDuckPosY += 56
      this.ctx!.drawImage(this.duckImg, 10, this.currDuckPosY);
    }
  }



  incScore() {
    this.score++; //service for retaining maxscore maybe
  }

}
