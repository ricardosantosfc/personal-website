import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
//simple serivce for storing and updating maxScore 
@Injectable({
  providedIn: 'root'
})
export class GameService {
  private maxScore = 0;

  constructor() { }

  getMaxScore(): number {
    return this.maxScore;
  }
  
  updateMaxScore(currScore: number): number {
    console.log(this.maxScore);
    if (this.maxScore < currScore) {
      this.maxScore = currScore;

    }
    return this.maxScore
  }
}
