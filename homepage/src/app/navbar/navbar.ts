import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouterLinkActive } from "@angular/router";
import { Game } from "../game/game";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Game],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  isTouchOnly = false; 
  isGameActive = signal(false);
  hovering = signal(false);
  hoverTimeout = 0;

  // somewhat hacky, but works - review for programatically setting up needed event handlers
  // atm 2 event listners: one for the part8, 1 for the full logo
  // on hover able dvices, full logo click is neglected
  // on non hover able dvices, part 8 logo click is neglected, so is only processed by full logo
  // alternatively, set only S logo clickable instead of whole logo on non hover, 
  ngOnInit(){
    this.isTouchOnly = !window.matchMedia('(any-hover: hover)').matches;
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

  setGameActive() {

    this.hovering.set(false);
    this.isGameActive.update((isGameActive) => !isGameActive); /* might have to change to enable/disable but for now ok */
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


