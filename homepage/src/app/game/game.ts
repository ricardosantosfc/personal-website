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

  private skyImg = new Image();
  private waterImg = new Image();
  private waterImg2 = new Image();
  private waterImg3 = new Image();
  private offsetSkyWaterY = 15; //push water up
  private frameCount = 0;

  private shadowImg = new Image();

  private duckImg = new Image();
  private duckGameOverImg = new Image();
  private currDuckPosY = 0;
  private initialDuckPosY = 0;
  private duckPosX = 100; //x offset, w = 51, //also needs to be proportional to the canvas width
  private duckEndPosX = 0; //so occupies 10-61, but for good measure do it programmatically

  private obstacleImg = new Image();
  private obstacleOffsetPosY = 0; // 2.5 for barrels // to "anchor" obstacles in lanes
  private obstacleWidth = 0; // 20 per figma
  private obstacleFrontHitboxOffset = 25; //for duck obstacles, increase htibox when htting the front of the obstacle
  private obstacleBackHitboxOffset = -15; //for duck obstacles, decrease hitbox when hitting the backof the obstacle (so beak still gets a pass)

  private obstaclesToDestroyCount = 0;
  private spawningBaseTimeout = 500;

  obstacles: Obstacle[] = [];
  currObstacleSpeed = 3.0; // px per frame
  initialObstacleSpeed = 3.0;
  speedIncrease = 0.005; //0.01
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
    //console.log(this.duckPosX/canvas.width);// 0.059844404548174746 as normal canvaswidht/100
    this.duckPosX = canvas.width * 0.0598; //this needs tobe done after a resize, after a game over
    // Scale drawing context
    ctx?.scale(dpi, dpi);

    // Background for testing
    //canvas.style.background = '#000000ff';

    if (ctx) {
      this.ctx = ctx;
      //this.showControls() -> then on lcick ws,aup or down, start spawing obstacles
      this.startGame();
    }
  }

  startGame() {
    this.frameCount = 0;
    this.currObstacleSpeed = this.initialObstacleSpeed;
    this.obstaclesToDestroyCount = 0;
    this.score = 0;
    this.duckImg.onload = () => {
      const nh = this.duckImg.naturalHeight; //37.8 per figma
      const nw = this.duckImg.naturalWidth; //51
      this.initialDuckPosY = ((this.height - nh) / 2) + 55;
      this.duckEndPosX = this.duckPosX + nw; //this is wh in eeded offsets, it wasnt being assigned correctly
      this.currDuckPosY = this.initialDuckPosY;
    };
    this.duckImg.src = 'duck_eye_stroke.svg';
    this.shadowImg.src = "shadow7.svg"
    this.skyImg.src = 's4 5.png';
    this.waterImg.src = 's1 5.png'
    this.waterImg2.src = 's2 5.png'
    this.waterImg3.src = 's3 5.png'

    this.duckGameOverImg.src = 'duck_sad_stroke.svg'; //review . see if ok to do here
    this.obstacleImg.src = 'obstacle12.svg';

    // on first command, 
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
      this.ctx!.drawImage(this.shadowImg, this.duckPosX, this.currDuckPosY + this.shadowImg.naturalHeight+36);
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
          this.ctx!.drawImage(this.shadowImg, obstacle.x, obstacle.y + this.shadowImg.naturalHeight+36);
          this.ctx!.drawImage(this.obstacleImg, obstacle.x, obstacle.y);
          
        }

        if ((this.currDuckPosY - this.obstacleOffsetPosY == obstacle.y) && (this.duckPosX- this.obstacleFrontHitboxOffset < obstacle.x && obstacle.x < this.duckEndPosX + this.obstacleBackHitboxOffset)) {
          this.gameOver();
          this.isGameRunning = false;
          return;
        }
      });

      //clear out of canvas obstacles if any. count should at most be 1, but to account for frame loss..
      if (this.obstaclesToDestroyCount !== 0) {
        this.obstacles.splice(0, this.obstaclesToDestroyCount);
        this.obstaclesToDestroyCount = 0;
      }

      this.currObstacleSpeed += this.speedIncrease;
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
  }

  gameOver() {
    this.hasDrawnGameOverCanvas = false;
    
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

  this.ctx!.drawImage(this.skyImg, 0,0, width, midY1 + 1 - this.offsetSkyWaterY);
   
   if(this.frameCount <= 12){
    this.ctx!.drawImage(this.waterImg, 0,height, width, midY1-height-this.offsetSkyWaterY);
    this.frameCount++;
   }else if(this.frameCount<=24){
     this.ctx!.drawImage(this.waterImg2, 0,height, width, midY1-height-this.offsetSkyWaterY);
      this.frameCount++;
   }else if(this.frameCount<=36){
     this.ctx!.drawImage(this.waterImg3, 0,height, width, midY1-height-this.offsetSkyWaterY);
      this.frameCount++;
      if(this.frameCount==37){
        this.frameCount = 0;
      }
    }

  }

  moveDuck() {

    if (this.currDuckPosY === this.initialDuckPosY) {
      this.currDuckPosY -= 56;
    } else {
      this.currDuckPosY += 56
    }
  }

}
