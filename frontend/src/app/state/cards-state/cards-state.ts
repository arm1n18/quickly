import { Injectable } from '@angular/core';
import {Module} from '../../interfaces/quizCard.interface';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CardsState {
  private _module$ = new BehaviorSubject<Module | null>(null);
  public module$ = this._module$.asObservable();

  public setModule(module: Module) {
    this._module$.next(module);
  }

  public changeCard(card: {id: number, title: string, description: string}) {
    const module = this._module$.value
    if(!module) return

    module.cards = module.cards.map(c => {
      if(c.id == card.id) {
        return {
          ...c,
          title: {
            ...c.title,
            text: card.title
          },
          description: {
            ...c.description,
            text: card.description
          }
        }
      }
      return c
    })

    this._module$.next(module)
  }

  public getModule(): Module | null {
    return this._module$.value
  }
}
