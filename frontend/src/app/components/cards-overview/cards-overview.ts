import {Component, Input} from '@angular/core';
import {Card} from '../../interfaces/quizCard.interface';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal-directive";

@Component({
  selector: 'app-cards-overview',
  imports: [
    ImageModalDirective
],
  templateUrl: './cards-overview.html',
  styleUrl: './cards-overview.css'
})
export class CardsOverview {
  @Input() cards: Card[] = [];
}
