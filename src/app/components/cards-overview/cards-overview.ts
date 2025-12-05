import {Component, Input} from '@angular/core';
import {Card} from '../../interfaces/quizCard.interface';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-cards-overview',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './cards-overview.html',
  styleUrl: './cards-overview.css'
})
export class CardsOverview {
  @Input() cards: Card[] = [];
}
