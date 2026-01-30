import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-rating',
  imports: [IconComponent],
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class RatingComponent {
  @Input({required: true}) rating: number =  0;
  @Input() singleStar: boolean =  true;
  @Input() votes?: number

  get stars() {
    return Array.from({ length: 5 }, (_, index) => ({
      id: index,
      fill: Math.floor(this.rating) > index ? 'var(--accent)' : 'var(--secondary)'
    }));
  }
}
