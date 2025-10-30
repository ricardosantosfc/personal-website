import { Component, signal } from '@angular/core';
import { Navbar } from "./navbar/navbar";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

   ngOnInit() {
    console.log("looking for an easter egg or something?\nI won´t quack under pressure, but I can tell you it's not here!\n\nWell you know, I mean, technically, uh... You see, it's not here if you uh... this is not meant to, uh... don't count this an easter egg too, ok?")
  }
}
