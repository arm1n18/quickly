import { Injectable } from '@angular/core';
import { DropdownComponent } from '../../components/ui';
import { UserAvatarComponent } from '../../components/user-avatar/user-avatar.component';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  private active: Map<symbol, DropdownComponent | UserAvatarComponent> = new Map()

  public open(id: symbol, comp: DropdownComponent | UserAvatarComponent) {
    for (const [key, dropdown] of this.active) {
      if (key !== id) {
        dropdown.close();
      }
    }

    if (this.active) {
      this.close(id, comp);
    }

    this.active.set(id, comp);
  }

  public close(id: symbol, comp: DropdownComponent | UserAvatarComponent) {
    const current = this.active.get(id);
    if (current === comp) {
      this.active.delete(id);
    }
  }
}
