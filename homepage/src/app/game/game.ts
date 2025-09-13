import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { GameService } from '../game-service';
interface Obstacle {
  x: number;
  y: number;
  hasSpawnedNext: boolean;
}
@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})

export class Game {

  private gameService = inject(GameService);

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  maxScore=0;
  score = 0;
  ctx!: CanvasRenderingContext2D | null;
  width = 0;
  height = 0;

  isGameRunning = true;
  hasDrawnGameOverCanvas = false; //quick fix to disallow controls as long as gameover canvas isnt draw. might be overkill.review

  private controlSet = new Set(['w', 's', 'ArrowDown', 'ArrowUp', " "]) //will override space and key up down scrolling

  private duckImg = new Image();
  private duckGameOverImg = new Image();
  private currDuckPosY = 0;
  private initialDuckPosY = 0;
  private duckPosX = 10; //x offset, w = 51, 
  private duckEndPosX = 0; //so occupies 10-61, but for good measure do it programmatically

  private obstacleImg = new Image();
  private obstacleOffsetPosY = 2.5; // to "anchor" obstacles in lanes
  private obstacleWidth = 0; // 20 per figma

  private obstaclesToDestroyCount = 0;
  private spawningBaseTimeout = 200;

  obstacles: Obstacle[] = [];
  currObstacleSpeed = 3.0; // px per frame
  initialObstacleSpeed = 3.0;
  spawnInterval: any;
  animationFrameId = 0;

  //handle controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.controlSet.has(event.key)) { //will override space and key up down scrolling
      this.handleClick();
    }

  }

  //hande click inside canvas
  handleClick() {
    if (this.isGameRunning) {
      this.moveDuck();
    } else {
      if(this.hasDrawnGameOverCanvas){
this.canvasRef.nativeElement.style.cursor = "default";
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.startGame();
      this.isGameRunning = true;
      }
      
    }

  }

  ngAfterViewInit() {
    this.maxScore = this.gameService.getMaxScore();
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
    this.currObstacleSpeed = this.initialObstacleSpeed;
    this.obstaclesToDestroyCount = 0;
    this.score = 0;
    this.duckImg.onload = () => {
      const nh = this.duckImg.naturalHeight; //37.8 per figma
      const nw = this.duckImg.naturalWidth; //51
      this.duckEndPosX = nw;
      this.initialDuckPosY = ((this.height - nh) / 2) + 5;
      this.currDuckPosY = this.initialDuckPosY;
    };
    this.duckImg.src = 'duck_eye_stroke.svg';

    this.duckGameOverImg.src = 'duck_sad_stroke.svg'; //review . see if ok to do here
    this.obstacleImg.src = 'obstacle9.svg';

    this.obstacleImg.onload = () => {
      this.obstacleWidth = this.obstacleImg.naturalWidth; //20 per figmas
      this.spawnObstacles(this.currObstacleSpeed);
      this.animate();
    };

  }

  spawnObstacles(speed: number) {
    this.spawnInterval = setTimeout(() => {

      //gen random 0 or 1 to place on bottom or top lane
      const minCeiled = Math.ceil(0);
      const maxFloored = Math.floor(2);
      const random = Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);

      const newObstacle: Obstacle = {
        x: this.width,
        y: random == 0 ? this.initialDuckPosY - this.obstacleOffsetPosY : this.initialDuckPosY - this.obstacleOffsetPosY - 56, //w offset to anchor them on the lanes
        hasSpawnedNext: false
      };

      this.obstacles.push(newObstacle);
    }, this.spawningBaseTimeout / speed); // will decrease prportionally with the obstacles speed increase
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
      this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + this.maxScore, 10, 10);

      this.obstacles.forEach((obstacle): void => {
        obstacle.x -= this.currObstacleSpeed;

        if (obstacle.x < this.width / 1.13 && obstacle.hasSpawnedNext === false) { //review, 
          this.spawnObstacles(this.currObstacleSpeed);
          obstacle.hasSpawnedNext = true;
        }
        if (obstacle.x + this.obstacleWidth < 0) {
          this.obstaclesToDestroyCount++; //curr index 0 obstacle
          this.score++;
        } else {
          this.ctx!.drawImage(this.obstacleImg, obstacle.x, obstacle.y);
        }

        if ((this.currDuckPosY - this.obstacleOffsetPosY == obstacle.y) && (this.duckPosX < obstacle.x && obstacle.x < this.duckEndPosX)) {
          this.gameOver();
          return;
        }
      });

      //clear out of canvas obstacles if any. count should at most be 1, but to account for frame loss..
      if (this.obstaclesToDestroyCount !== 0) {
        this.obstacles.splice(0, this.obstaclesToDestroyCount);
        this.obstaclesToDestroyCount = 0;
      }

      this.currObstacleSpeed += 0.01;
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  gameOver() {
    this.hasDrawnGameOverCanvas = false;
    this.isGameRunning = false;
    this.maxScore = this.gameService.updateMaxScore(this.score);
    cancelAnimationFrame(this.animationFrameId);
    clearInterval(this.spawnInterval);
    this.ctx!.drawImage(this.duckGameOverImg, this.duckPosX, this.currDuckPosY); //drawn on top of duck img
    setTimeout(() => { // stop the canvas for some time before trnasitioning imeddiatly to gameover screen
      this.obstacles.length = 0;

      this.ctx!.clearRect(0, 0, this.width, this.height);

      this.ctx!.font = "50px Nunito";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textAlign = "center";
      this.ctx!.fillText("Ya blew it!!", this.width / 2, 10);

      this.ctx!.font = "30px Nunito";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textBaseline = "middle";
      this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + this.maxScore, this.width / 2, this.height / 2);

      this.ctx!.font = "20px Nunito";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textBaseline = "bottom";
      this.ctx!.fillText("Click or press w, s, space, \u2191, or \u2193 to play again", this.width / 2, this.height - 10);
      this.canvasRef.nativeElement.style.cursor = "pointer";
      this.hasDrawnGameOverCanvas = true;
    }, 500);
    
  }


  drawLanes(width: number, height: number) {
    const midY1 = height / 2 - 28;
    const midY2 = height / 2 + 28;

    this.ctx!.fillStyle = "rgba(23, 27, 30, 1)";
    this.ctx!.beginPath(); // Start a new path
    this.ctx!.rect(0, 0, width, height); // Add a rectangle to the current path
    this.ctx!.fill(); // Render the path

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

}
