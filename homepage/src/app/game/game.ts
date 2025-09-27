import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { GameService } from '../game-service';
import { GameState } from '../game-state';

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

  private ctx!: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;

  private maxScore = 0;
  private score = 0;

  private gameState = GameState.Loading;

  private controlSet = new Set(['w', 's', 'ArrowUp']) //arrow up might still be problemtaic?

  private skyImg = new Image();
  private waterImg = new Image();
  private waterImg2 = new Image();
  private waterImg3 = new Image();
  private offsetSkyWaterY = 15; //push water up
  private backgroundFrameCount = 0;

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
  private spawnTimer = 500;

  private obstacles: Obstacle[] = [];
  private currObstacleSpeed = 3.0; // px per frame
  private initialObstacleSpeed = 3.0;
  private speedIncrease = 0.005; //0.01
  private spawnTimeoutId: any;

  private animationFrameId = 0;



  @HostListener('window:resize')
  onResize() {

    this.scaleCanvas();
    //and if non animating = non running, redraw canvas
    if (this.gameState === GameState.ShowingGameOverCanvas) {
      this.showGameOverCanvas();
    } else if (this.gameState === GameState.ShowingControls) {
      this.showControls();
    }
  }

  //handle controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.controlSet.has(event.key)) { //will override space and key up down scrolling
      this.handleClick();
    }

  }

  //hande click inside canvas and controlset.has
  handleClick() {

    if (this.gameState === GameState.Running) {
      this.moveDuck();

    } else if (this.gameState === GameState.ShowingGameOverCanvas ||
      this.gameState === GameState.ShowingControls) {

      this.canvasRef.nativeElement.style.cursor = "default";
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.startGame();

    }

  }

  ngAfterViewInit() {

    this.maxScore = this.gameService.getMaxScore();
    this.scaleCanvas();
    this.loadAssets();

  }

  scaleCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    const dpi = window.devicePixelRatio || 1;

    // Get wrapper size — from the parent element!
    const parent = canvas.parentElement!;
    const parentRect = parent.getBoundingClientRect();
    console.log("game canvas viewport " + window.innerHeight);
    if(parentRect.height> window.innerHeight){ 
      
      console.log("heihgth canvas adjust")
      canvas.style.height = `${window.innerHeight-20}px`
    }

      this.width = parentRect.width;
    this.height = parentRect.height;
    // Set canvas internal resolution
    canvas.width = this.width * dpi;
    canvas.height = this.height * dpi;

    //console.log(this.duckPosX/this.width); // for this.widht  0.1048
    //console.log(this.spawnTimer/canvas.width); 0.2992 as canvaswidth ->500

    // setting duckPosX on resize means postionDucktoo
    this.duckPosX = this.width * 0.1048; //this needs tobe done after a resize, after a game over 
    this.positionDuck();
    if (this.width <= 768) { // review, maybe shouldn be triggered in resize while game is running
      this.spawnTimer = 1000;
    }

    // Scale drawing context
    ctx?.scale(dpi, dpi);

    if (ctx) {
      this.ctx = ctx;
    }
  }


  loadAssets() {

    this.duckImg.src = 'duck.svg';
    this.duckImg.onload = () => {
      this.positionDuck();
    };

    this.shadowImg.src = "shadow.svg"
    this.skyImg.src = 'sky.png';
    this.waterImg.src = 'water1.png'
    this.waterImg2.src = 'water2.png'
    this.waterImg3.src = 'water3.png'

    this.duckGameOverImg.src = 'duck_game_over.svg';
    this.obstacleImg.src = 'obstacle_grey.svg';
    this.obstacleImg.onload = () => {
      this.obstacleWidth = this.obstacleImg.naturalWidth;
      this.showControls();
    };

  }

  positionDuck() {
    const nh = this.duckImg.naturalHeight; //37.8 per figma
    const nw = this.duckImg.naturalWidth; //51
    this.initialDuckPosY = ((this.height - nh) / 2) + 55;
    this.duckEndPosX = this.duckPosX + nw;
    this.currDuckPosY = this.initialDuckPosY;
  }

  showControls() {

    this.drawBackground(this.width, this.height);
    this.ctx!.drawImage(this.shadowImg, this.duckPosX, this.currDuckPosY + this.shadowImg.naturalHeight + 36);
    this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY);

    //console.log(this.height);
    //fontScale = baseFontSize / baseCanvasWidth; // 0.02095 fro 955

    this.ctx!.font = "20px VT323";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textBaseline = "top";
    this.ctx!.textAlign = "left";
    this.ctx!.fillText("Score : " + 0 + "   " + "Max : " + this.maxScore, 10, 10);

    var responsiveFontSize = this.getResponsiveFontSize(40);
    this.ctx!.font = `${responsiveFontSize}px VT323`; //30px 30/955
    this.ctx!.textBaseline = "middle";
    this.ctx!.textAlign = "center";
    this.ctx!.fillText("Speed through the duckway!", this.width / 2, this.height / 2);


    responsiveFontSize = this.getResponsiveFontSize(25);
    this.ctx!.font = `${responsiveFontSize}px VT323`; //20px 20/955
    this.ctx!.textBaseline = "bottom";
    this.ctx!.textAlign = "center";
    this.ctx!.fillText("🖯, 🖢, 🠝, w, or s to play", this.width / 2, this.height - 10);

    this.gameState = GameState.ShowingControls;
    this.canvasRef.nativeElement.style.cursor = "pointer";

  }

  startGame() {

    this.backgroundFrameCount = 0;
    this.currObstacleSpeed = this.initialObstacleSpeed;
    this.obstaclesToDestroyCount = 0;
    this.score = 0;

    this.gameState = GameState.Running;
    this.spawnObstacles(this.currObstacleSpeed);
    this.animate();

  }

  spawnObstacles(speed: number) {
    this.spawnTimeoutId = setTimeout(() => {

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
    }, this.spawnTimer / speed); // will decrease prportionally with the obstacles speed increase
  }

  animate() {

    if (this.gameState === GameState.Running) {
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.drawBackground(this.width, this.height);
      this.ctx!.drawImage(this.shadowImg, this.duckPosX, this.currDuckPosY + this.shadowImg.naturalHeight + 36);
      this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY);

      this.ctx!.font = "20px VT323";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textBaseline = "top";
      this.ctx!.textAlign = "left";
      this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + this.maxScore, 10, 10);

      this.obstacles.forEach((obstacle): void => {
        obstacle.x -= this.currObstacleSpeed;

        if (obstacle.hasSpawnedNext === false && obstacle.x < this.width / 1.13) {
          this.spawnObstacles(this.currObstacleSpeed);
          obstacle.hasSpawnedNext = true;
        }
        if (obstacle.x + this.obstacleWidth < 0) { //or this.duckPosX
          this.obstaclesToDestroyCount++; //curr index 0 obstacle
          this.score++;
        } else {
          this.ctx!.drawImage(this.shadowImg, obstacle.x, obstacle.y + this.shadowImg.naturalHeight + 36);
          this.ctx!.drawImage(this.obstacleImg, obstacle.x, obstacle.y);

        }

        if ((this.currDuckPosY - this.obstacleOffsetPosY == obstacle.y) && (this.duckPosX - this.obstacleFrontHitboxOffset < obstacle.x && obstacle.x < this.duckEndPosX + this.obstacleBackHitboxOffset)) {
          this.gameOver();
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

    this.gameState = GameState.GameOver;
    this.maxScore = this.gameService.updateMaxScore(this.score);
    cancelAnimationFrame(this.animationFrameId);
    clearInterval(this.spawnTimeoutId);
    this.ctx!.drawImage(this.duckGameOverImg, this.duckPosX, this.currDuckPosY); //drawn on top of duck img, no need to clear
    setTimeout(() => { // stop the canvas for some time before trnasitioning imeddiatly to gameover screen
      this.obstacles.length = 0;

      this.ctx!.clearRect(0, 0, this.width, this.height);

      this.showGameOverCanvas();

      this.gameState = GameState.ShowingGameOverCanvas;

    }, 500);

  }

  showGameOverCanvas() {

    this.ctx!.fillStyle = "#ffffffff";
    var responsiveFontSize = this.getResponsiveFontSize(43);
    //also need to set it here in case of a reszie
    this.ctx!.font = `${responsiveFontSize}px VT323`; //30px 30/955
    this.ctx!.textAlign = "center";
    this.ctx!.textBaseline = "top";
    this.ctx!.fillText("Ya blew it!!", this.width / 2, 10);

    var responsiveFontSize = this.getResponsiveFontSize(32);
    this.ctx!.font = `${responsiveFontSize}px VT323`; //30px 30/955
    this.ctx!.textBaseline = "middle";
    this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + this.maxScore, this.width / 2, this.height / 2);

    responsiveFontSize = this.getResponsiveFontSize(25);
    this.ctx!.font = `${responsiveFontSize}px VT323`; //20px 20/955
    this.ctx!.textBaseline = "bottom";
    this.ctx!.fillText("🖯, 🖢, 🠝, w, or s to play again", this.width / 2, this.height - 10);
    this.canvasRef.nativeElement.style.cursor = "pointer";

  }


  drawBackground(width: number, height: number) {
    const midY1 = height / 2 - 28;

    this.ctx!.drawImage(this.skyImg, 0, 0, width, midY1 + 1 - this.offsetSkyWaterY);

    if (this.backgroundFrameCount <= 12) {
      this.ctx!.drawImage(this.waterImg, 0, height, width, midY1 - height - this.offsetSkyWaterY);
      this.backgroundFrameCount++;
    } else if (this.backgroundFrameCount <= 24) {
      this.ctx!.drawImage(this.waterImg2, 0, height, width, midY1 - height - this.offsetSkyWaterY);
      this.backgroundFrameCount++;
    } else if (this.backgroundFrameCount <= 36) {
      this.ctx!.drawImage(this.waterImg3, 0, height, width, midY1 - height - this.offsetSkyWaterY);
      this.backgroundFrameCount++;
      if (this.backgroundFrameCount == 37) { //needs to be done imeddiatly so next frame is already
        this.backgroundFrameCount = 0;
      }
    } //frameCount is inc on resizes but not problematic

  }

  moveDuck() {

    if (this.currDuckPosY === this.initialDuckPosY) {
      this.currDuckPosY -= 56;
    } else {
      this.currDuckPosY += 56
    }
  }

  getResponsiveFontSize(baseFontSize: number): number { //based on canvas prop, r
    const baseWidth = 954.95;
    const baseHeight = 389.99;

    const widthScale = this.width / baseWidth;
    const heightScale = this.height / baseHeight;
    const scale = Math.min(widthScale, heightScale);

    const minFont = 10;
    const maxFont = 36;

    return Math.max(minFont, Math.min(baseFontSize * scale, maxFont));
  }

}
