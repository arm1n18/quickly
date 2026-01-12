import { Component, Input } from '@angular/core';
import { Icon } from "../icon/icon";

@Component({
  selector: 'app-rating',
  imports: [Icon],
  templateUrl: './rating.html',
  styleUrl: './rating.css',
})
export class Rating {
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
