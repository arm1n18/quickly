import { Component, Input } from '@angular/core';
import { IconComponent } from '../../ui';

@Component({
  selector: 'app-FooterComponent',
  imports: [IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})

export class FooterComponent {
  @Input() background: string = "var(--lightGrey)"
}
