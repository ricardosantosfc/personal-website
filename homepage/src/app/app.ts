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
    console.log("looking for an easter egg or something?\nwell...I won´t quack under pressure, but I can tell you it's not here!\n\noh wait...\n\nthis an easter egg too???")
  }
}
