import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import { Module } from '../models/module.interface';

@Injectable({
  providedIn: 'root'
})

export class CardsState {
  private _module$ = new BehaviorSubject<Module | null>(null);
  public module$ = this._module$.asObservable();

  public setModule(module: Module) {
    this._module$.next(module);
  }

  public updateModuleByKey<T extends keyof Module>(key: T, value: Module[T]) {
    const current = this._module$.value;
    if (!current) return;
  
    const newModule = { ...current, [key]: value };
    this._module$.next(newModule);
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
