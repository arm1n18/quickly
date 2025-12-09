import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Portal {
  private outlet!: CdkPortalOutlet;

  registerOutlet(outlet: CdkPortalOutlet) {
    this.outlet = outlet;
  }

  open(portal: ComponentPortal<any>, props?: {[key: string]: any}) {
    if (!this.outlet) return
    const ref = this.outlet.attach(portal);

    if(props) {
      Object.entries(props).forEach(([k, v]) => {
        ref.instance[k] = v
      })
    }
  }

  close() {
    this.outlet.detach();
  }
}
