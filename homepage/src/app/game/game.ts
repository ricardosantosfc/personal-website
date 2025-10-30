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

  private controlSet = new Set(['w', 's', 'ArrowUp']) //arrowup will still trigger a scroll up if user is not at the top

  private skyImg = new Image();
  private waterImg0 = new Image();
  private waterImg1 = new Image();
  private waterImg2 = new Image();
  private offsetSkyWaterY = 15; //push water up so it seamlessly interesects sky
  private backgroundFrameCount = 0;

  private duckImg = new Image();
  private duckGameOverImg = new Image();
  private currDuckPosY = 0;
  private initialDuckPosY = 0;
  private duckPosX = 100; //x offset, w = 51, //also needs to be proportional to the canvas width
  private duckEndPosX = 0; //so occupies 10-61, but for good measure do it programmatically

  private obstacleImg = new Image();
  private obstacleWidth = 0;
  private obstacleFrontHitboxOffset = 25; //for obstacles, increase htibox when htting the front of the obstacle
  private obstacleBackHitboxOffset = -15; //for obstacles, decrease hitbox when hitting the backof the obstacle (so beak still gets a pass)

  private obstaclesToDestroyCount = 0;
  private spawnTimer = 500;

  private obstacles: Obstacle[] = [];
  private currObstacleSpeed = 3.0; // px per frame
  private initialObstacleSpeed = 3.0;
  private speedIncrease = 0.005;
  private spawnTimeoutId = 0;

  private animationFrameId = 0;

  private handpointerImg = new Image();
  private arrowUpImg = new Image();



  @HostListener('window:resize')
  onResize() {

    this.scaleCanvas();
    //and if non animating => non running, redraw canvas
    if (this.gameState === GameState.ShowingGameOverCanvas) {
      this.showGameOverCanvas();
    } else if (this.gameState === GameState.ShowingControls) {
      this.showControls();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.controlSet.has(event.key)) {
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

    this.ctx!.font = `11px 'Consolas', monospace`;
    this.ctx!.fillStyle = "#ddddddff";
    this.ctx!.textBaseline = "middle";
    this.ctx!.textAlign = "center";
    this.ctx!.fillText("Sir Splashy Squackson is warming up...", this.width / 2, this.height / 1.5);

    this.drawLoadingSpinner();

    this.loadAssets();

  }

  scaleCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    const dpi = window.devicePixelRatio || 1;

    // Get wrapper size — from the parent element!
    const parent = canvas.parentElement!;
    const parentRect = parent.getBoundingClientRect();

    if (parentRect.height > window.innerHeight) {
      canvas.style.height = `${window.innerHeight - 20}px`
    }

    this.width = parentRect.width;
    this.height = parentRect.height;
    // Set canvas internal resolution
    canvas.width = this.width * dpi;
    canvas.height = this.height * dpi;

    // Scale drawing context
    ctx?.scale(dpi, dpi);

    if (ctx) {
      this.ctx = ctx;
    }

    // setting duckPosX on resize means postionDucktoo
    this.duckPosX = this.width * 0.1048;

    if (this.gameState !== GameState.Loading) { //redundant on ngAfterInit, as its called after load promises fullfilled
      this.positionDuck();
      this.obstacleWidth = this.obstacleImg.naturalWidth;
    }

    if (this.gameState === GameState.Running) { //styles are reset as well, must set it back
      this.ctx!.font = "20px VT323, monospace";
      this.ctx!.fillStyle = "#ffffffff";
      this.ctx!.textBaseline = "top";
      this.ctx!.textAlign = "left";
    }

    if (this.width <= 768) {
      this.spawnTimer = 1000;
    }

  }

  private drawLoadingSpinner(): void {

    this.ctx!.beginPath();
    this.ctx!.lineWidth = 6;
    this.ctx!.strokeStyle = '#ddddddff';

    //to avoid creating another property, uses backgroundframecount as a counter, which is zero'd on showcontrols.
    this.ctx!.arc(this.width / 2, this.height / 2, 30, 0, Math.PI * (0.05 + this.backgroundFrameCount));
    this.ctx!.stroke();
    this.backgroundFrameCount += 0.01;

    this.animationFrameId = requestAnimationFrame(() => this.drawLoadingSpinner());
  }

  private async loadAssets(): Promise<void> {
    await Promise.all([
      this.loadImage(this.duckImg, '/game/duck.svg'),
      this.loadImage(this.skyImg, '/game/sky.png'),
      this.loadImage(this.waterImg0, '/game/water0.png'),
      this.loadImage(this.waterImg1, '/game/water1.png'),
      this.loadImage(this.waterImg2, '/game/water2.png'),
      this.loadImage(this.duckGameOverImg, '/game/duck_game_over.svg'),
      this.loadImage(this.obstacleImg, '/game/obstacle.svg'),
      this.loadImage(this.handpointerImg, '/game/hand-pointer-game.svg'),
      this.loadImage(this.arrowUpImg, '/game/arrow-up.svg'),
      document.fonts.load("20px VT323")
    ]);
    this.positionDuck();
    this.obstacleWidth = this.obstacleImg.naturalWidth;
    this.showControls(); // Safe to call now
  }


  private loadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(err);
      img.src = src;

    });
  }

  positionDuck() {
    const nh = this.duckImg.naturalHeight; //37.8 per figma
    const nw = this.duckImg.naturalWidth; //51
    this.initialDuckPosY = ((this.height - nh) / 2) + 55;
    this.duckEndPosX = this.duckPosX + nw;
    this.currDuckPosY = this.initialDuckPosY;
  }

  showControls() {

    //stop loading anim, reset counter used in anim
    cancelAnimationFrame(this.animationFrameId);
    this.backgroundFrameCount = 0;

    this.drawBackground(this.width, this.height);

    this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY);

    this.ctx!.font = "20px VT323, monospace";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textBaseline = "top";
    this.ctx!.textAlign = "left";
    this.ctx!.fillText("Score : " + 0 + "   " + "Max : " + this.maxScore, 10, 10);

    var responsiveFontSize = this.getResponsiveFontSize(40);
    this.ctx!.font = `${responsiveFontSize}px VT323, monospace`; 
    this.ctx!.textBaseline = "middle";
    this.ctx!.textAlign = "center";
    this.ctx!.fillText("Speed through the duckway!", this.width / 2, this.height / 2);

    responsiveFontSize = this.getResponsiveFontSize(25);
    this.showControlsAux(", w, or s to play", responsiveFontSize);

    this.gameState = GameState.ShowingControls;
    this.canvasRef.nativeElement.style.cursor = "pointer";

  }

  showControlsAux(text: string, responsiveFontSize: number) {

    this.ctx!.font = `${responsiveFontSize}px VT323, monospace`; 
    this.ctx!.textBaseline = "bottom";
    this.ctx!.textAlign = "left"; // will be centered manually

    const iconSize = responsiveFontSize;
    const spacing = 1; 
    const commaText = ",";
    const y = this.height - 10;

    // Measure individual widths
    const commaWidth = this.ctx!.measureText(commaText).width;
    const textWidth = this.ctx!.measureText(text).width;
    const handWidth = iconSize;
    const arrowWidth = iconSize;

    // Total layout width
    const totalWidth =
      handWidth + spacing +
      commaWidth + spacing +
      arrowWidth + spacing +
      textWidth;

    var x = (this.width - totalWidth) / 2;

    this.ctx!.drawImage(this.handpointerImg, x, y - iconSize + 4, iconSize - 8, iconSize - 7);
    x += handWidth + spacing;

    this.ctx!.fillText(commaText, x - 10, y);
    x += commaWidth + spacing;

    this.ctx!.drawImage(this.arrowUpImg, x - 2, y - iconSize + 4, iconSize - 7, iconSize - 7);
    x += arrowWidth + spacing;

    this.ctx!.fillText(text, x - 8, y);

  }

  startGame() {

    this.backgroundFrameCount = 0;
    this.currObstacleSpeed = this.initialObstacleSpeed;
    this.obstaclesToDestroyCount = 0;
    this.score = 0;

    //prepare font for game
    this.ctx!.font = "20px VT323, monospace";
    this.ctx!.fillStyle = "#ffffffff";
    this.ctx!.textBaseline = "top";
    this.ctx!.textAlign = "left";

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
        y: random == 0 ? this.initialDuckPosY : this.initialDuckPosY - 56,
        hasSpawnedNext: false
      };

      this.obstacles.push(newObstacle);
    }, this.spawnTimer / speed); // will decrease proportionally to obstacles speed increase
  }

  animate() {

    if (this.gameState === GameState.Running) {
      this.ctx!.clearRect(0, 0, this.width, this.height);
      this.drawBackground(this.width, this.height);

      this.ctx!.drawImage(this.duckImg, this.duckPosX, this.currDuckPosY);

      this.ctx!.fillText(`Score : ${this.score}   Max : ${this.maxScore}`, 10, 10);

      this.obstacles.forEach((obstacle, index): void => {
        obstacle.x -= this.currObstacleSpeed;

        if (obstacle.hasSpawnedNext === false && obstacle.x < this.width / 1.13) {
          this.spawnObstacles(this.currObstacleSpeed);
          obstacle.hasSpawnedNext = true;
        }
        if (obstacle.x + this.obstacleWidth < 0) { //or this.duckPosX
          this.obstaclesToDestroyCount++; //curr index 0 obstacle
          this.score++;
        } else {
          this.ctx!.drawImage(this.obstacleImg, obstacle.x, obstacle.y);

          if (index < 3) { //duck will always only be able to hit first 2 incoming, 1 more as margin for not destroyed
            if ((this.currDuckPosY == obstacle.y) && (this.duckPosX - this.obstacleFrontHitboxOffset < obstacle.x && obstacle.x < this.duckEndPosX + this.obstacleBackHitboxOffset)) {
              this.gameOver();
              return;
            }
          }
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
    var responsiveFontSize = this.getResponsiveFontSize(40);

    this.ctx!.font = `${responsiveFontSize}px VT323, monospace`; 
    this.ctx!.textAlign = "center";
    this.ctx!.textBaseline = "top";
    this.ctx!.fillText("Ya blew it!!", this.width / 2, 10);

    var responsiveFontSize = this.getResponsiveFontSize(32);
    this.ctx!.font = `${responsiveFontSize}px VT323, monospace`; 
    this.ctx!.textBaseline = "middle";
    this.ctx!.fillText("Score : " + this.score + "   " + "Max : " + this.maxScore, this.width / 2, this.height / 2);

    responsiveFontSize = this.getResponsiveFontSize(25);

    this.showControlsAux(", w, or s to play again", responsiveFontSize);

    this.canvasRef.nativeElement.style.cursor = "pointer";

  }


  drawBackground(width: number, height: number) {
    const midY1 = height / 2 - 28;

    this.ctx!.drawImage(this.skyImg, 0, 0, width, midY1 + 1 - this.offsetSkyWaterY);

    if (this.backgroundFrameCount <= 12) {
      this.ctx!.drawImage(this.waterImg0, 0, height, width, midY1 - height - this.offsetSkyWaterY);
      this.backgroundFrameCount++;
    } else if (this.backgroundFrameCount <= 24) {
      this.ctx!.drawImage(this.waterImg1, 0, height, width, midY1 - height - this.offsetSkyWaterY);
      this.backgroundFrameCount++;
    } else if (this.backgroundFrameCount <= 36) {
      this.ctx!.drawImage(this.waterImg2, 0, height, width, midY1 - height - this.offsetSkyWaterY);
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

  getResponsiveFontSize(baseFontSize: number): number { //props based on my laptop
    const baseWidth = 954.95;
    const baseHeight = 389.99;

    const widthScale = this.width / baseWidth;
    const heightScale = this.height / baseHeight;
    const scale = Math.min(widthScale, heightScale);

    const minFont = 20;
    const maxFont = 40;

    return Math.max(minFont, Math.min(baseFontSize * scale, maxFont));
  }

}
