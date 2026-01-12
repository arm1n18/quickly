import { Injectable } from '@angular/core';
import {Module} from '../../interfaces/quizCard.interface';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardsState {
  private _module$ = new BehaviorSubject<Module | null>(null);
  module$ = this._module$.asObservable();

  setModule(module: Module) {
    this._module$.next(module);
  }
}
