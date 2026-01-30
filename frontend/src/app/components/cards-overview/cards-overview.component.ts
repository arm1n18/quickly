import {Component, Input} from '@angular/core';
import {Module} from '../../interfaces/module.interface';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal.directive";
import { EditCardButtonComponent } from '../edit-card-button/edit-card-button.component';

@Component({
  selector: 'app-cards-overview',
  imports: [
    ImageModalDirective,
    EditCardButtonComponent
],
  templateUrl: './cards-overview.html',
  styleUrl: './cards-overview.css'
})
export class CardsOverviewComponent {
  @Input() module: Module | null = null;
}
