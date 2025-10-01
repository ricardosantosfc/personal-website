import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { Footer } from "../footer/footer";
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
  imports: [Footer],
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
      description: "A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.",
      github: "https://github.com/ricardosantosfc/saveDforest",
      link: "https://savedforest-temp-test-2.onrender.com/"
    },
    {
      id: 1,
      images: ["/projects/homepage1 (10).png"],
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



  private pauseBetweenImages = 7000;
  lastImageSwitchTime = -7000; //so as not to have a swtiching period on the first trnasition after ngafterviewinit

  currTitle = signal("saveDforest");
  currDescription = signal("A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.");
  currLink = signal("https://savedforest-temp-test-2.onrender.com/");
  currGithub = signal("https://github.com/ricardosantosfc/saveDforest");
  isLinkShown = signal(true);
  isGithubShown = signal(true);
  isAnimatingEntrance = signal(true);

  currProjectIndex = 0;
  private animationFrameId = 0;




  @HostListener('window:resize')
  onResize() {

    this.footer.nativeElement.style.height = 'auto';
    this.resizeFooter();


  }

  ngAfterViewInit() {

    //this.showProject(0);
    setTimeout(() => {
      this.resizeFooter();
    }, 0.3);





  }

  showProject(index: number) {

    this.currImage.set(this.projects[index]!.images[0]); //mightn need load
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
    console.log("mouse over");
    if (this.currImagesToAnimate > 0) {



      this.animate(performance.now());

    }

  }

  private animate(timestamp: number): void {

    if (timestamp - this.lastImageSwitchTime >= this.pauseBetweenImages) {

      console.log("animating"); 
      this.isChangingImage = true;

      this.currOpacityImage.set(0);


      this.lastImageSwitchTime = timestamp;
    }

    this.animationFrameId = requestAnimationFrame((t) => this.animate(t));
  }


  handleOpacityTransitionStart() {
    if (this.isChangingImage === true) {
      console.log("on the transition end next should change image")
    }else{
      console.log("next trnasition end no change")
    }
  }

  handleOpacityTransitionEnd() {
    if (this.isChangingImage === true) {
      console.log("will change image now");
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

    }else{
      console.log("nochange this end");
    }
      
    }
  

  stopAnimatingImages() {

    if (this.animationFrameId !== 0) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
      this.isChangingImage = false;
      this.currOpacityImage.set(0);
      setTimeout(() => {
        this.lastImageSwitchTime = 0;
        this.currImage.set(this.projects[this.currProjectIndex]!.images[0]);
        this.currOpacityImage.set(1);
        this.currImageToAnimateIndex = 1;
      }, 500);

    }
  }


  resizeFooter() {

    const whatContentHeight = this.content.nativeElement.offsetHeight;

    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whatContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {
      const newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12; //remove margins

      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
  }


}