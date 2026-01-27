import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalStateService {
  private openedCount$ = new BehaviorSubject(0);

  open() {
    this.openedCount$.next(this.openedCount$.value + 1);
  }

  close() {
    this.openedCount$.next(Math.max(0, this.openedCount$.value - 1));
  }

  isAnyOpen(): boolean {
    return this.openedCount$.value > 0;
  }

  isAnyOpen$() {
    return this.openedCount$.pipe(map(c => c > 0));
  }
}
