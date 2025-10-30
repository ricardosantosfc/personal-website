import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { SizeService } from '../services/size-service';
import { NgOptimizedImage } from '@angular/common';


interface Project {
  id: number
  images: string[];
  title: string;
  description: string;
  stack: string[];
  github?: string;
  link?: string;
}

@Component({
  selector: 'app-what',
  imports: [NgOptimizedImage],
  templateUrl: './what.html',
  styleUrl: './what.css'
})
export class What {

  projects: Project[] = [ 
    {
      id: 0,
      images: ["/what/savedforest0.png", "/what/savedforest1.png", "/what/savedforest2.png",
        "/what/savedforest3.png", "/what/savedforest4.png", "/what/savedforest5.png"],
      title: "saveDforest",
      description:
        "A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.",
      stack: ["Unity", "Angular", "Express.js", "Node.js", "MongoDB"],
      github: "https://github.com/ricardosantosfc/saveDforest",
      link: "https://savedforest-temp-test-2.onrender.com/"
    },
    {
      id: 1,
      images: ["/what/personal-website.png"],
      title: "Personal website",
      description: "My personal website, which you're browsing right now.",
      stack: ["Angular"],
      github: "https://github.com/ricardosantosfc/personal-website"
    },

  ];

  @ViewChild('whatContent') content!: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer!: ElementRef<HTMLDivElement>;
  @ViewChild('projectText') projectText!: ElementRef<HTMLDivElement>;

  private sizeService = inject(SizeService);

  currImage = signal("/what/savedforest0.png");
  currImagesToAnimate = 5;
  currImageToAnimateIndex = 1;
  currOpacityImage = signal(1);
  isChangingImage = false;
  hoverable = signal(true);

  private pauseBetweenImages = 5000;
  lastImageSwitchTime = -5000; //so as not to have a swtiching period on the first trnasition after ngafterviewinit

  currTitle = signal("saveDforest");
  currDescription = signal("A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.");
  currStack = signal(["Unity", "Angular", "Express.js", "Node.js", "MongoDB"]);
  currLink = signal("https://savedforest-temp-test-2.onrender.com/");
  currGithub = signal("https://github.com/ricardosantosfc/saveDforest");
  isLinkShown = signal(true);
  isGithubShown = signal(true);
  isAnimatingEntrance = signal(false); //remains true until next project shown, when it turns false until proj image is loaded. then true again
  currOpacityProjectWrapper= signal(0); //set to 1 after image loaded

  currProjectTextHeight = -1; //could be much better by having landscape and portrait, thne switch case, but much more coplex

  currProjectIndex = 0;
  private animationFrameId = 0;

  private controlSet = new Set(['ArrowLeft', 'ArrowRight'])


  @HostListener('window:resize')
  onResize() {

    this.checkProjectTextOverflow();
    this.footer.nativeElement.style.height = 'auto';
    this.resizeFooter();

  }

  //handle controls
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.controlSet.has(event.key)) {
      this.stopAnimatingImages();
      if (event.key === 'ArrowLeft') {
        this.handlePrevClick();
      } else {
        this.handleNextClick();
      }
    }

  }

  ngAfterViewInit() {

    //this.showProject(0) not needed, already set when props are declared

    // fonts might not be ready yet. this one seems redundant, 
    // but required for avoiding annoying flash when second resizefooter triggers
    // space bar might however be momementarily shown, but still less bothersome than flash
    this.resizeFooter(); 

    document.fonts.ready.then(() => { 
      this.resizeFooter(); 
    });
    this.hoverable.set(window.matchMedia('(pointer: fine').matches);
  }

  checkProjectTextOverflow() { //when called by resize, not entirely accurate (due to no debounce prob), but not for less, so not that problematic. having one sperate for portrait and landscape would prob prevent this as well
    const isOverflowing = this.projectText.nativeElement.scrollHeight > this.projectText.nativeElement.clientHeight;
    if (isOverflowing) {
      this.currProjectTextHeight = this.projectText.nativeElement.scrollHeight;
      this.projectText.nativeElement.style.height = `${this.currProjectTextHeight}px`

    }
  }

  handleEntranceAnimationStart() {
    if (this.currProjectTextHeight === -1) {
      this.currProjectTextHeight = this.projectText.nativeElement.offsetHeight; //keep initial
      this.projectText.nativeElement.style.height = `${this.currProjectTextHeight}px` //lock height to inital (tallest one)

    } else {
      this.checkProjectTextOverflow();
    }

    if (!this.hoverable()) {
      this.stopAnimatingImages() //first, stop animation if any, = behavior as when mouse leave due to enter animation being triggerd
    }

  }


  showProject(index: number) {

    this.currImage.set(this.projects[index]!.images[0]);
    this.currImagesToAnimate = this.projects[index]!.images.length - 1;
    this.currTitle.set(this.projects[index]!.title);
    this.currDescription.set(this.projects[index]!.description);
    this.currStack.set(this.projects[index]!.stack);

    if (this.projects[index]?.link !== undefined) {
      this.currLink.set(this.projects[index]!.link!);
      this.isLinkShown.set(true);
    } else {
      this.isLinkShown.set(false);
    }
    if (this.projects[index]?.github !== undefined) {
      this.currGithub.set(this.projects[index]!.github!);
      this.isGithubShown.set(true);
    } else {
      this.isGithubShown.set(false);
    }

  }

  showProjectWithEntranceAnimation(index: number) {
    this.isAnimatingEntrance.set(false);

    //set opacity to 0 to avoid annoying old image staying and new image popping in much later
    // and enter animation will only be triggered once the new image has been loaded on HandleImageLoad
    this.currOpacityProjectWrapper.set(0); 

    requestAnimationFrame(() => {
      this.showProject(index)
    });
  }


  toggleDot(index: number) {
    this.currProjectIndex = index;
    this.showProjectWithEntranceAnimation(index);
  }

  handleNextClick() {

    if (this.currProjectIndex + 1 === this.projects.length) {
      this.currProjectIndex = 0;
    } else {
      this.currProjectIndex++;
    }
    this.showProjectWithEntranceAnimation(this.currProjectIndex);
  }

  handlePrevClick() {
    if (this.currProjectIndex + -1 < 0) {
      this.currProjectIndex = this.projects.length - 1;
    } else {
      this.currProjectIndex--;
    }
    this.showProjectWithEntranceAnimation(this.currProjectIndex);
  }

  animateImages() {

    if (this.currImagesToAnimate > 0) {

      this.animateImageSwitching(performance.now());

    }

  }


  private animateImageSwitching(timestamp: number): void { //lastImageSwitchTime might still need tiny adjustment on stop. 


    if (timestamp - this.lastImageSwitchTime >= this.pauseBetweenImages) {

      this.isChangingImage = true;
      this.currOpacityImage.set(0);

    }

    this.animationFrameId = requestAnimationFrame((t) => this.animateImageSwitching(t));
  }


  handleOpacityTransitionEnd() {

    if (this.isChangingImage === true) {
      this.currImage.set(
        this.projects[this.currProjectIndex]!.images[this.currImageToAnimateIndex]
      );

      if (this.currImageToAnimateIndex + 1 > this.currImagesToAnimate) {
        this.currImageToAnimateIndex = 1;
      } else {
        this.currImageToAnimateIndex++;
      }


    }
  }

  handleImageLoad() {
    if(!this.isAnimatingEntrance()){ //Entrance anim waiting for load

      this.isAnimatingEntrance.set(true);
      this.currOpacityProjectWrapper.set(1); //animation keyframes override this, so no need to wait for animation to end to set
      return;
    }

    if (this.isChangingImage) {
      this.isChangingImage = false;
      this.lastImageSwitchTime = performance.now();
      this.currOpacityImage.set(1);

    }
  }


  stopAnimatingImages() { //on switch, enter animation automatically triggers a mouse leave, 

    if (this.animationFrameId !== 0) {

      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
      this.isChangingImage = false;

      this.currOpacityImage.set(0);
      setTimeout(() => { //easier to do this through timeout rather than transtion event listeners.
        this.lastImageSwitchTime = 0;
        this.currImage.set(this.projects[this.currProjectIndex]!.images[0]);
        this.currOpacityImage.set(1);
        this.currImageToAnimateIndex = 1;
      }, 700);

    }
  }

  resizeFooter() { /* 16 if margin top = 1em, 12 if margin top = 0.5em  -> bttr off in sizeService (contentHeight) : new footerheight*/

    const whoContentHeight = this.content.nativeElement.offsetHeight;

    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whoContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {  //remove margins 12
      var newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12 

      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
  }


}