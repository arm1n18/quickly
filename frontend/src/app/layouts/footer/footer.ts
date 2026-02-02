import { Component, Input } from '@angular/core';
import { IconComponent } from "../../components/ui";

@Component({
  selector: 'app-footer',
  imports: [IconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})

export class Footer {
  @Input() background: string = "var(--lightGrey)"
}
