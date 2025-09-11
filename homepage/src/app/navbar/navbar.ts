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

  /* in mobile do not check hovering, and css query(hover ) none , in mobile maybe just keep the beak fill blinking*/
  isGameActive = signal(false);
  hovering = signal(false);
  
  setGameActive() {
    this.isGameActive.update((isGameActive) => !isGameActive); /* might have to change to enable/disable but for now ok */
  }

  isHovering() {
    this.hovering.update((hovering) => !hovering); /* too expensiver perfomance wise maybe */
  }
  
}


