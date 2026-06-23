import { Injectable } from '@angular/core';
import { UserAvatarComponent } from '../../../features/user/components/user-avatar/user-avatar.component';
import { DropdownComponent, KeywordsInputComponent } from 'app/shared/ui';

@Injectable({
  providedIn: 'root',
})
export class DropdownService {
  private active: Map<symbol, DropdownComponent | UserAvatarComponent | KeywordsInputComponent> = new Map()

  public open(id: symbol, comp: DropdownComponent | UserAvatarComponent | KeywordsInputComponent) {
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

  public close(id: symbol, comp: DropdownComponent | UserAvatarComponent | KeywordsInputComponent) {
    const current = this.active.get(id);
    if (current === comp) {
      this.active.delete(id);
    }
  }
}
