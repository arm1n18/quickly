import {Component, Input} from '@angular/core';
import {Module} from '../../interfaces/quizCard.interface';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal-directive";
import { EditCardButton } from "../edit-card-button/edit-card-button";

@Component({
  selector: 'app-cards-overview',
  imports: [
    ImageModalDirective,
    EditCardButton
],
  templateUrl: './cards-overview.html',
  styleUrl: './cards-overview.css'
})
export class CardsOverview {
  @Input() module: Module | null = null;
}
