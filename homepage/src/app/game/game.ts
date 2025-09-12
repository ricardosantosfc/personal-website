import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
interface Obstacle {
  x: number;
  y: number;
  toRemove: boolean;
}
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

  isGameRunning = true;

  private controlSet = new Set(['w', 's', 'ArrowDown', 'ArrowUp', " "]) //will override space and key up down scrolling

  private duckImg = new Image();
  private currDuckPosY = 0;
  private initialDuckPosY = 0;
  private duckPosX = 10; //x offset, w = 51, so occupies 10-61, but for good measure o it programmatically
  private duckEndPosX = 0;

  private obstacleImg = new Image();
  private obstacleWidth = 0; // 20 per figma

  obstacles: Obstacle[] = [];
  obstacleSpeed = 3.0; // px per frame
  spawnInterval: any;
  animationFrameId = 0;

  //handle controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.controlSet.has(event.key) && this.isGameRunning) {
      this.moveDuck();
    }

  }

  //hande click inside canvas
  handleClick() {
    if(this.isGameRunning){
      this.moveDuck();
    }else{
      this.canvasRef.nativeElement.style.cursor = "default";
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.startGame();
      this.isGameRunning = true;
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
    //canvas.style.background = '#000000ff';

    if (ctx) {
      this.ctx = ctx;
      this.startGame();
    }
  }

  startGame() {
    this.score = 0;
    this.drawLanes(this.width, this.height); //not needed as already in animate
    this.duckImg.onload = () => {
      const nh = this.duckImg.naturalHeight; //37.8 per figma
      const nw = this.duckImg.naturalWidth; //51
      this.duckEndPosX = nw;
      this.initialDuckPosY = ((this.height - nh) / 2) + 5;
      this.currDuckPosY = this.initialDuckPosY;
      this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY, nw, nh);
    };
    this.duckImg.src = 'duck.svg';

    this.obstacleImg.src = 'obstacle.svg';

    this.obstacleImg.onload = () => {
      this.obstacleWidth = this.obstacleImg.naturalWidth; //20 per figmas
      this.spawnObstacles();
      this.animate();
    };
    
  }

  spawnObstacles() {
    this.spawnInterval = setInterval(() => {

      //gen random 0 or 1 to place on bottom or top lane
      const minCeiled = Math.ceil(0);
      const maxFloored = Math.floor(2);
      const random = Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);

      const newObstacle: Obstacle = {
        x: this.width,
        y: random == 0 ? this.initialDuckPosY - 4 : this.initialDuckPosY - 4 - 56, //w offset to anchor them on the lanes
        toRemove: false
      };

      this.obstacles.push(newObstacle);
    }, 1000); // every second
  }

  animate() {

    if (this.isGameRunning) {
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.drawLanes(this.width, this.height);
      this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY);

      this.ctx!.font = "20px Nunito";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textBaseline = "top";
      this.ctx!.textAlign = "left";
      this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + "0", 10, 0);

      this.obstacles.forEach((obstacle, index) => {
        obstacle.x -= this.obstacleSpeed;


        if (obstacle.x + this.obstacleWidth < 0) {
          obstacle.toRemove = true;
          this.score++;
        } else {
          this.ctx!.drawImage(this.obstacleImg, obstacle.x, obstacle.y);
        }

        if ((this.currDuckPosY - 4 == obstacle.y) && (this.duckPosX < obstacle.x && obstacle.x < this.duckEndPosX)) {
          this.gameOver();
          return;
        }
      });

      this.obstacles.forEach((obstacle, index) => { //review this, maybe not perf optimal
        if(obstacle.toRemove ===true){
          this.obstacles.splice(index,1);
        }
      });
      
      //this.obstacleSpeed += 0.01;
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  gameOver() {
    this.isGameRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    clearInterval(this.spawnInterval);
    this.obstacles.length = 0;

    this.canvasRef.nativeElement.style.cursor = "pointer";
    this.ctx!.clearRect(0, 0, this.width, this.height);

    this.ctx!.font = "50px Nunito";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textAlign = "center";
    this.ctx!.fillText("Ya blew it!!", this.width/2, 0);

     this.ctx!.font = "30px Nunito";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textBaseline = "middle";
    this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + "0", this.width/2, this.height/2);

    this.ctx!.font = "20px Nunito";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textBaseline = "bottom";
    this.ctx!.fillText("Click anywhere to play again", this.width/2, this.height);
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

  moveDuck() {

    if (this.currDuckPosY === this.initialDuckPosY) {
      this.currDuckPosY -= 56;
    } else {
      this.currDuckPosY += 56
    }
  }

  incScore() {
    this.score++;
  }

}
