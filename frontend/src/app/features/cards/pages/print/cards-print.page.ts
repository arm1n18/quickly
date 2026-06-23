import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cards-print-page',
  imports: [],
  templateUrl: './cards-print.page.html',
  styleUrl: './cards-print.page.css'
})

export class CardsPrintPageComponent {
  @ViewChild('printSection') printSection!: ElementRef;
  pdfDataUrl: string | null = null;
}
