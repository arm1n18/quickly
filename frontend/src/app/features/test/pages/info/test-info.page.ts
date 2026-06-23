import { FooterComponent, HeaderComponent } from 'app/shared/components';
import { IconComponent } from 'app/shared/ui';
import { Component } from '@angular/core';

@Component({
  selector: 'app-test-info-page',
  imports: [FooterComponent, HeaderComponent, IconComponent],
  templateUrl: './test-info.page.html',
  styleUrl: './test-info.page.css',
})
export class TestInfoPageComponent {

}
