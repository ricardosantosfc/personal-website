import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { SizeService } from '../size-service';


interface Project {
  id: number
  images: string[];
  title: string;
  description: string;
  github?: string;
  link?: string;
}

@Component({
  selector: 'app-what',
  imports: [],
  templateUrl: './what.html',
  styleUrl: './what.css'
})
export class What {

  projects: Project[] = [ // [style] doesnt work with spaces inside the  strings
    {
      id: 0,
      images: ["/projects/savedforest0.png", "/projects/savedforest1.png", "/projects/savedforest2.png",
        "/projects/savedforest3.png", "/projects/savedforest4.png", "/projects/savedforest5.png"],
      title: "saveDforest",
      description:
        "A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.",
      github: "https://github.com/ricardosantosfc/saveDforest",
      link: "https://savedforest-temp-test-2.onrender.com/"
    },
    {
      id: 1,
      images: ["/projects/homepage1.png"],
      title: "Personal website",
      description: "My personal website, the one you're browsing right now.",
      github: "https://github.com/ricardosantosfc/homepage"
    },

  ];

  @ViewChild('whatContent') content!: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer!: ElementRef<HTMLDivElement>;
  private sizeService = inject(SizeService);


  currImage = signal("/projects/savedforest0.png");
  currImagesToAnimate = 5;
  currImageToAnimateIndex = 1;
  currOpacityImage = signal(1);
  isChangingImage = false;

  private pauseBetweenImages = 5000;
  lastImageSwitchTime = -5000; //so as not to have a swtiching period on the first trnasition after ngafterviewinit

  currTitle = signal("saveDforest");
  currDescription = signal("A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.");
  currLink = signal("https://savedforest-temp-test-2.onrender.com/");
  currGithub = signal("https://github.com/ricardosantosfc/saveDforest");
  isLinkShown = signal(true);
  isGithubShown = signal(true);
  isAnimatingEntrance = signal(true);

  currProjectIndex = 0;
  private animationFrameId = 0;

  private controlSet = new Set(['ArrowLeft', 'ArrowRight']) 


  @HostListener('window:resize')
  onResize() {

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
       }else{
        this.handleNextClick();
       }
    }

  }


  ngAfterViewInit() {

    //this.showProject(0)
    this.resizeFooter();

  }

  //log all viewchilds to see whats not being corrctly calculated
  resizeFooter() { /* 16 if margin top = 1em, 12 if margin top = 0.5em */

    const whoContentHeight = this.content.nativeElement.offsetHeight;

    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whoContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {
      const newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12; //remove margins
      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
  }

  showProject(index: number) {

    this.currImage.set(this.projects[index]!.images[0]);
    this.currImagesToAnimate = this.projects[index]!.images.length - 1;
    this.currTitle.set(this.projects[index]!.title);
    this.currDescription.set(this.projects[index]!.description);

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

  showProjectWithAnimation(index: number) {
    this.isAnimatingEntrance.set(false);

    requestAnimationFrame(() => {
      this.showProject(index)
      this.isAnimatingEntrance.set(true);
    });
  }


  toggleDot(index: number) {
    this.currProjectIndex = index;
    this.showProjectWithAnimation(index);
  }

  handleNextClick() {

    if (this.currProjectIndex + 1 === this.projects.length) {
      this.currProjectIndex = 0;
    } else {
      this.currProjectIndex++;
    }
    this.showProjectWithAnimation(this.currProjectIndex);
  }

  handlePrevClick() {
    if (this.currProjectIndex + -1 < 0) {
      this.currProjectIndex = this.projects.length - 1;
    } else {
      this.currProjectIndex--;
    }
    this.showProjectWithAnimation(this.currProjectIndex);
  }


  animateImages() {

    if (this.currImagesToAnimate > 0) {

      this.animate(performance.now());

    }

  }

  private animate(timestamp: number): void { //lastImageSwitchTime might still need tiny adjustment on stop. 

    if (timestamp - this.lastImageSwitchTime >= this.pauseBetweenImages) {

      this.isChangingImage = true;
      this.currOpacityImage.set(0);
      this.lastImageSwitchTime = timestamp;

    }

    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
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
      this.isChangingImage = false;
      this.currOpacityImage.set(1);

    }
  }


  stopAnimatingImages() {

    if (this.animationFrameId !== 0) {

      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
      this.isChangingImage = false;

      this.currOpacityImage.set(0);
      setTimeout(() => { //easier to do this through timeout rather than trnastionevent listeners.
        this.lastImageSwitchTime = 0;
        this.currImage.set(this.projects[this.currProjectIndex]!.images[0]);
        this.currOpacityImage.set(1);
        this.currImageToAnimateIndex = 1;
      }, 500);

    }
  }

}