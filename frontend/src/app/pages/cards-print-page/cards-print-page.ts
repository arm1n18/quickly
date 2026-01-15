import { Component, ElementRef, ViewChild } from '@angular/core';
import { Module } from '../../interfaces/quizCard.interface';
import { combineLatest } from 'rxjs';
import { CardsState } from '../../state/cards-state/cards-state';

@Component({
  selector: 'app-cards-print-page',
  imports: [],
  templateUrl: './cards-print-page.html',
  styleUrl: './cards-print-page.css'
})

export class CardsPrintPage {
  @ViewChild('printSection') printSection!: ElementRef;
  pdfDataUrl: string | null = null;
}
