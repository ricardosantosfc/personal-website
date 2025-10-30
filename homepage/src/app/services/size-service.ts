import { Injectable } from '@angular/core';

//service for keeping up with navbar height for footer resize calculations
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

