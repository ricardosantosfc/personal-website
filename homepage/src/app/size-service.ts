import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SizeService {
  private navbarHeight= 0;
  constructor() { }
  getNavbarHeight(): number{
  return this.navbarHeight;
}
  updateNavbarHeigth(height:number){
    this.navbarHeight = height;

  }

}

