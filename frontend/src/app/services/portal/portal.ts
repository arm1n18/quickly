import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Portal {
  private outlet!: CdkPortalOutlet;
  private openedCount$ = new BehaviorSubject(0);
  

  public registerOutlet(outlet: CdkPortalOutlet) {
    this.outlet = outlet;
  }

  public open(portal: ComponentPortal<any>, props?: {[key: string]: any}) {
    if (!this.outlet) return
    const ref = this.outlet.attach(portal);

    if(props) {
      Object.entries(props).forEach(([k, v]) => {
        ref.instance[k] = v
      })
    }

    this.openedCount$.next(this.openedCount$.value + 1);
  }

  public close() {
    this.outlet.detach();
    this.openedCount$.next(Math.max(0, this.openedCount$.value - 1));
  }

  public isAnyOpen(): boolean {
    return this.openedCount$.value > 0;
  }
}
