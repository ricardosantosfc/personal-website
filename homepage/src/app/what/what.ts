import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { Footer } from "../footer/footer";
import { SizeService } from '../size-service';

@Component({
  selector: 'app-what',
  imports: [Footer],
  templateUrl: './what.html',
  styleUrl: './what.css'
})
export class What {

  @ViewChild('whatContent') content!: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer!: ElementRef<HTMLDivElement>;
  private sizeService = inject(SizeService);


  @HostListener('window:resize')
  onResize() {

    this.footer.nativeElement.style.height = 'auto';
    this.resizeFooter();


  }

    ngAfterViewInit() {
    this.resizeFooter()

  }

  
  resizeFooter() {

    const whatContentHeight = this.content.nativeElement.offsetHeight;
    const availableWindowHeight = window.innerHeight - (this.sizeService.getNavbarHeight() + whatContentHeight! + 12); //includes margins

    if (availableWindowHeight > 0) {
      const newFooterHeight = this.footer.nativeElement.offsetHeight + availableWindowHeight - 12; //remove margins
      this.footer.nativeElement.style.height = `${newFooterHeight}px`
    }
  }


}