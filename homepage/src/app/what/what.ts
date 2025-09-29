import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { Footer } from "../footer/footer";
import { SizeService } from '../size-service';

interface Project {
  id: number
  image: string;
  title: string;
  description: string; //times to alternate aimating between the sprites before end sprite
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

  projects: Project[] = [
    {
      id: 0,
      image: "/projects/project1.png",
      title: "saveDforest",
      description: "A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.",
      github: "https://github.com/ricardosantosfc/saveDforest",
      link: "https://savedforest-temp-test-2.onrender.com/"
    },
    {
      id: 1,
      image: "/projects/project1.png",
      title: "Personal website",
      description: "My personal website, the one you're browsing right now.",
      github: "https://github.com/ricardosantosfc/homepage"
    },
    {
      id: 2,
      image: "/projects/project1.png",
      title: "test 3",
      description: "test descrpiton.",
      link: "https://github.com/ricardosantosfc/homepage"
    },
  ];

  @ViewChild('whatContent') content!: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer!: ElementRef<HTMLDivElement>;
  private sizeService = inject(SizeService);

  currImage = signal("/projects/project1.png");
  currTitle = signal("saveDforest");
  currDescription = signal("A serious game for promoting environmentally sustainable behaviors through empathy, embedded in a web app.");
  currLink = signal("https://savedforest-temp-test-2.onrender.com/");
  currGithub = signal("https://github.com/ricardosantosfc/saveDforest");
  isLinkShown = signal(true);
  isGithubShown = signal(true);
  isAnimating = signal(true);

  currProjectIndex = 0;




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

    this.currImage.set(this.projects[index]!.image); //mightn need load
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
    this.isAnimating.set(false);

    requestAnimationFrame(() => {
      this.showProject(index)
      this.isAnimating.set(true);
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

  resizeFooter() {

    const whatContentHeight = this.content.nativeElement.offsetHeight;

    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whatContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {
      const newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12; //remove margins

      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
  }


}