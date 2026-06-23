import {Component, Input} from '@angular/core';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { EditCardButtonComponent } from '../edit-card-button/edit-card-button.component';
import { Module } from 'app/features/modules/models/module.interface';

@Component({
  selector: 'app-cards-overview',
  imports: [
    ImageModalDirective,
    EditCardButtonComponent
],
  templateUrl: './cards-overview.component.html',
  styleUrl: './cards-overview.component.css'
})
export class OverviewComponent {
  @Input() module: Module | null = null;
}
