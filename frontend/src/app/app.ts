import { RouterOutlet } from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';
import { Portal } from './services/portal/portal';
import { CdkPortalOutlet, PortalModule } from '@angular/cdk/portal';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PortalModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  @ViewChild('rootOutlet', { read: CdkPortalOutlet, static: true }) outlet!: CdkPortalOutlet;

  constructor(
    private portalService: Portal
  ) {}

   ngOnInit() {
    this.portalService.registerOutlet(this.outlet);
  }
}
