import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhoService {
  private initialDialogEnded = false;

  constructor() { }

  hasInitialDialogEnded(): boolean {
    return this.initialDialogEnded;
  }
  
  updateInitialDialogEnded() {
    this.initialDialogEnded =true;
  }
}
