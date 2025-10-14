import { Component, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from "@angular/router";
import { Game } from "../game/game";
import { SizeService } from '../size-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Game],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
 @ViewChild('navbar') navbar!: ElementRef<HTMLDivElement>;
  isTouchOnly = false; 
  isGameActive = signal(false);
  hovering = signal(false);
  isLightMode = signal(false);
  hoverTimeout = 0;
  sizeService = inject(SizeService);
  showThemeButton = signal(true);

  // somewhat hacky, but works - review for programatically setting up needed event handlers
  // atm 2 event listners: one for the part8, 1 for the full logo
  // on hover able dvices, full logo click is neglected
  // on non hover able dvices, part 8 logo click is neglected, so is only processed by full logo
  // alternatively, set only S logo clickable instead of whole logo on non hover, 
  ngOnInit(){
    this.isTouchOnly = !window.matchMedia('(any-hover: hover)').matches;
    this.checkShowThemeButton();
  }

  @HostListener('window:resize')
  onResize() {
    this.sizeService.updateNavbarHeigth( this.navbar.nativeElement.parentElement!.offsetHeight)
    this.checkShowThemeButton();
  }

  checkShowThemeButton(){
    const shouldHide = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
    this.showThemeButton.set(!shouldHide);
  }


  ngAfterViewInit(){
    this.sizeService.updateNavbarHeigth( this.navbar.nativeElement.parentElement!.offsetHeight) //non float

  }

  handleLogoPart8Click(){ 
    if(this.isTouchOnly=== false ){
      this.setGameActive();
    }
  }

  handleLogoClick(){

    if(this.isTouchOnly===true){
      this.setGameActive();
    }
  }

  handleThemeButtonClick(){
      const body = document.body; //find btter way without accesing dom directly
  body.classList.toggle('light-theme');
  this.isLightMode.set(!this.isLightMode())

  }

  setGameActive() {

    this.hovering.set(false);
    this.isGameActive.update((isGameActive) => !isGameActive); /* might have to change to enable/disable but for now ok */
     //if landscape, open game -> potarait, close game , needs resize 
    /* should trigger resize who if foote is speacial. but needs a debounce or gets the game navbar height
    if(this.isGameActive() === false){
      this.sizeService.updateNavbarHeigth(this.navbar.nativeElement.parentElement!.offsetHeight);
      console.log(this.navbar.nativeElement.parentElement!.offsetHeight);
    } */
    
  }


  isHovering(state: boolean) {
    clearTimeout(this.hoverTimeout);
    if (state) {
      this.hovering.set(true);
    } else {
      this.hoverTimeout = setTimeout(() => {
        this.hovering.set(false);
      }, 500); 
    }
  }
  
}


