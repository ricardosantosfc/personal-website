import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { WhoService } from '../who-service';
import { SizeService } from '../size-service';
import { Footer } from "../footer/footer";

interface Dialogs {
  text: string;
  spriteAlternations: number; //times to alternate aimating between the sprites before end sprite
  sprites: number[]; //spirtes?: 
  endSprite: number; //the sprite on which to end the animation
  nextDialogIndex: number; //index of the nex t dialog
  enableButtons?: number;
}
@Component({
  selector: 'app-who',
  imports: [Footer],
  templateUrl: './who.html',
  styleUrl: './who.css'
})
export class Who {

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('whoContent') content!: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer!: ElementRef<HTMLDivElement>;

  private ctx!: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;

  //closed mouth = uneven sptrites, excpet for 33,34
  private dialogs: Dialogs[] = [
    {
      text: "...",
      spriteAlternations: 0,
      sprites: [0],
      endSprite: 0,
      nextDialogIndex: 1
    },
    {
      text: "Hi, I'm Ricardo Santos!",
      spriteAlternations: 2,
      sprites: [1, 2, 3, 4],
      endSprite: 0,
      nextDialogIndex: 2
    },
    {
      text: "I'm a software engineer from Lisbon, Portugal.",
      spriteAlternations: 5,
      sprites: [5, 6],
      endSprite: 6,
      nextDialogIndex: 3
    },
    {
      text: "I enjoy creating full-stack applications with rich, highly interactive frontends...", //apps interesctions diff
      spriteAlternations: 9,
      sprites: [7, 8],
      endSprite: 8,
      nextDialogIndex: 4
    },
    {
      text: "... and I'm also very interested in game development.",
      spriteAlternations: 5,
      sprites: [9, 10],
      endSprite: 10,
      nextDialogIndex: 5
    },
    {
      text: "That being said, I'm always eager to learn new things, especially if they're out of my comfort zone!",
      spriteAlternations: 10,
      sprites: [11, 12],
      endSprite: 12,
      nextDialogIndex: 6
    },
    {
      text: "When I'm not working on software, I'm likely making music, 3D modeling, watercolor painting, or sketching.",
      spriteAlternations: 13,
      sprites: [33, 34],
      endSprite: 33,
      nextDialogIndex: 7
    },
    {
      text: "... Just give me a second please...",
      spriteAlternations: 4,
      sprites: [13, 14],
      endSprite: 14,
      nextDialogIndex: 8
    },
    {
      text: "I have some copies of my resume here. ",
      spriteAlternations: 7,
      sprites: [15, 16],
      endSprite: 16,
      nextDialogIndex: 9
    },
    {
      text: "Would you like to have one? ",
      spriteAlternations: 5,
      sprites: [17, 18],
      endSprite: 18,
      nextDialogIndex: 10,
      enableButtons: 0
    },
    {
      text: "Here you go! Thank you. ",
      spriteAlternations: 2,
      sprites: [19, 20],
      endSprite: 30,
      nextDialogIndex: 13
    },
    {
      text: "No problem! If you change your mind, just ask and i'll give it to you. ", //oh right! you already have it
      spriteAlternations: 8,
      sprites: [21, 22],
      endSprite: 22,
      nextDialogIndex: 12
    },
    {
      text: "... ", //oh right! you already have it
      spriteAlternations: 0,
      sprites: [24],
      endSprite: 24,
      nextDialogIndex: 13
    },
    {
      text: "Thanks for visiting my website!",
      spriteAlternations: 3,
      sprites: [25, 26],
      endSprite: 26,
      nextDialogIndex: 14
    },

    {
      text: "Let me know if you have any further questions, I'll be here all day!",
      spriteAlternations: 7,
      sprites: [27, 28],
      endSprite: 28,
      nextDialogIndex: 15
    },
    {
      text: "", //----------------------------- no dialog box. click on cnavas. iflenght text = 0 back to 15
      spriteAlternations: 0,
      sprites: [37],
      endSprite: 37, //empty sprite
      nextDialogIndex: 16
    },
    {
      text: "Hi again! is there anything I can help you with?", //------btns again
      spriteAlternations: 7,
      sprites: [5, 6],
      endSprite: 6,
      nextDialogIndex: 16,
      enableButtons: 1
    },
    {
      text: "Sure! Here!",
      spriteAlternations: 1,
      sprites: [13, 17, 18, 19, 20],
      endSprite: 30,
      nextDialogIndex: 15
    },
    {
      text: "You can reach out to me through email or LinkedIn. Just click on the icons down below.",
      spriteAlternations: 8,
      sprites: [7, 8],
      endSprite: 8,
      nextDialogIndex: 15
    },
    {
      text: "Well, besides working on this website, I've been learning how to use React and Three.js. I've also been refreshing my SQL skills.",
      spriteAlternations: 14,
      sprites: [9, 10],
      endSprite: 10,
      nextDialogIndex: 20
    },
    { /* 𝘄𝗵𝗮𝘁 might not be supportted by some dievices*/
      text: "If you'd like to learn more about some of the projects i've worked on, click on the [what] link up above.",
      spriteAlternations: 9,
      sprites: [31, 32],
      endSprite: 32,
      nextDialogIndex: 15
    },
    {
      text: "Sure, no problem!",
      spriteAlternations: 3,
      sprites: [25, 26],
      endSprite: 26,
      nextDialogIndex: 2
    },
  ];

  private whoService = inject(WhoService);
  private sizeService = inject(SizeService);

  //state - showButtons, notInteracting, Interacting
  isButtonShown = signal(false);
  isButtonsResumeShown = signal(false);
  isButtonsEndShown = signal(false);
  isNameShown = signal(false);
  isDialogShown = signal(false); //better to start as false so it doesnt flash when finished initial 
  isCanvasAcceptingClicks = signal(true);
  isInteracting = signal(true);

  hoverable= signal(true);
  
  private isAnimating = false; //to redraw ends sprite on resize if not

  private spritesheetImg = new Image();
  private spriteSizeIncrease = 80;

  currDialogIndex = 0;
  currDialogText = signal("");
  private frameCount = 0;
  private currAlternatingTimes = -1;
  private currDialogSpriteIndex = -1;

  private animationFrameId = 0;

  @HostListener('window:resize')
  onResize() {

    /** //needs debouncing
     setTimeout(()=> {
      this.resizeFooter();
     },500);
     */

    this.footer.nativeElement.style.height = 'auto';
    this.resizeFooter();
    this.scaleCanvas();

    if (this.isAnimating === false) { //must redraw curr end sprite
      const currSpritePosX = this.dialogs[this.currDialogIndex].endSprite;
      this.drawSprite(currSpritePosX);
    }


  }

  handleCanvasKeydown(event: KeyboardEvent): void {
  if (event.code === 'Enter') {
    event.preventDefault(); 
    this.handleCanvasClick();
  }
}

  ngOnInit(){
    this.hoverable.set(window.matchMedia('(hover: hover)').matches);
  }

  //16+32+16
  ngAfterViewInit() {
    this.resizeFooter()
    this.scaleCanvas();
    this.loadAssets();
  }

  resizeFooter() { /* 16 if margin top = 1em, 12 if margin top = 0.5em */

    const whoContentHeight = this.content.nativeElement.offsetHeight;
    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whoContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {
      const newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12; //remove margins
      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
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


    this.spritesheetImg.src = 'spritesheet512_3lowerhighlights.png';
    this.spritesheetImg.onload = () => {

      if (this.whoService.hasInitialDialogEnded() === true) {
        this.currDialogIndex = 15;
        this.isInteracting.set(false);
      } else {
        this.currDialogText.set(this.dialogs[0].text);
        this.isDialogShown.set(true);
        this.drawSprite(0);
      }

    };

  }

  drawSprite(spritePosX: number) {
    //x spritestart, yspritestart (from top), x spritesize, yspritesize, x canvas start, y canvasstart ,dimensions in canvas 
    /* this.ctx!.drawImage(this.spritesheetImg, 512 * 0, 0, 512, 512, 
              ((this.width - this.height)-10) / 2, -10, this.height+10, this.height+10)*/

    this.ctx!.drawImage(this.spritesheetImg, 512 * spritePosX, 0, 512, 512,
      ((this.width - this.height) - this.spriteSizeIncrease) / 2, -this.spriteSizeIncrease,
      this.height + this.spriteSizeIncrease, this.height + this.spriteSizeIncrease)
  }


  handleCanvasClick() {

    //mihgt have to cancel out curr animate here if clicks are accepted wihlle animating

    if (this.isInteracting() === false) { //really wonky. refactoring needed
      this.enableDialogBoxAndName();
      this.isInteracting.set(true);
    }
    if (this.dialogs[this.currDialogIndex].enableButtons !== undefined) { //enable buttons
      this.disableDialogBoxAndName();
      this.enableChoiceButtons(this.dialogs[this.currDialogIndex].enableButtons!);
    } else {
      this.currDialogIndex = this.dialogs[this.currDialogIndex].nextDialogIndex;
      if (this.currDialogIndex === 2) {
        this.isNameShown.set(true);
      } else if (this.currDialogIndex === 15) {
        if (this.whoService.hasInitialDialogEnded() === false) {
          this.whoService.updateInitialDialogEnded();
        }
        this.disableDialogBoxAndName();
        this.isCanvasAcceptingClicks.set(true);
        this.ctx!.clearRect(0, 0, this.width, this.height);
        this.isInteracting.set(false);
        return;
      }
      this.isCanvasAcceptingClicks.set(false);
      this.showDialog();
    }

  }

  enableDialogBoxAndName() {
    this.isNameShown.set(true);
    this.isDialogShown.set(true);
  }

  disableDialogBoxAndName() {
    this.isNameShown.set(false);
    this.isDialogShown.set(false);
  }

  enableChoiceButtons(category: number) { //isButtonShown(0,1,2) replace single signal

    this.isButtonShown.set(true);
    if (category === 0) {
      this.isButtonsResumeShown.set(true);
    } else {
      this.isButtonsEndShown.set(true);
    }
    this.isCanvasAcceptingClicks.set(false);
  }


  handleChoiceButtonClick(nextDialogIndex: number) {

    this.currDialogIndex = nextDialogIndex;
    this.showDialog();
    this.isButtonsEndShown.set(false);
    this.isButtonsResumeShown.set(false);
    this.isButtonShown.set(false);
    this.enableDialogBoxAndName();

  }

  showDialog() {
    this.currAlternatingTimes = this.dialogs[this.currDialogIndex].spriteAlternations;
    this.currDialogSpriteIndex = 0;
    this.animate();
    this.isAnimating = true;
    this.currDialogText.set(this.dialogs[this.currDialogIndex].text);
    this.isCanvasAcceptingClicks.set(true); // should be at the end of animate
  }

  animate() { //somewhat contrived, review

    this.ctx!.clearRect(0, 0, this.width, this.height);

    var currSpritePosX = this.dialogs[this.currDialogIndex].sprites[this.currDialogSpriteIndex];

    if (this.currAlternatingTimes > 0) {

      if ((this.frameCount) <= 10) {
        this.drawSprite(currSpritePosX);
        this.frameCount++;
        if (this.frameCount === 11) {
          this.frameCount = 0;
          this.currDialogSpriteIndex++;
          if (this.currDialogSpriteIndex === this.dialogs[this.currDialogIndex].sprites.length) { //circle all
            this.currAlternatingTimes--;
            this.currDialogSpriteIndex = 0;

          }

        }
      }
    } else {
      currSpritePosX = this.dialogs[this.currDialogIndex].endSprite;
      this.drawSprite(currSpritePosX);
      this.isAnimating = false;
      //tirgger lcik here if ===6 after timeout
      return;

    }


    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }



}
