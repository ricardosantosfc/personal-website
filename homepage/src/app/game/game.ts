import { Component } from '@angular/core';

@Component({
  selector: 'app-game',
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.css'
})
export class Game {
 counter=0;


 incCounter(){
  this.counter++; //service for retaining maxscore maybe
 }
}
