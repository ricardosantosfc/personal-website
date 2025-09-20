import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';

@Component({
  selector: 'app-who',
  imports: [],
  templateUrl: './who.html',
  styleUrl: './who.css'
})
export class Who {

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;

  private spritesheetImg = new Image();
  private currDialogIndex = 0;
  private canvasIsAcceptingClicks = false;
  private frameCount = 0;

  @HostListener('window:resize')
  onResize() {

    this.scaleCanvas();
     this.ctx!.drawImage(this.spritesheetImg, 512, 32, 512, 512, (this.width-512)/2, 0, 512, 512)
  }

    ngAfterViewInit() {
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
  }

  loadAssets() {

    this.spritesheetImg.src = 'spritesheet512.png';
    this.spritesheetImg.onload = () => { //x spritestart, yspritestart (from top), x spritesize, yspritesize, x canvas start, y canvasstart
      this.ctx!.drawImage(this.spritesheetImg, 512, 32, 512, 512, (this.width-512)/2, 0, 512, 512) //can play with gamew rapper heigth and here sy
      this.canvasIsAcceptingClicks = true;
    };

  }

  handleClick() {

    if (this.canvasIsAcceptingClicks === true) {
        this.showDialog();
      
    }


    //if in choice, ignore

  }

  showDialog(){ 
    //dialog count
    // number of times to 

  }



}
