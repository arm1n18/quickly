import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Validator {
  isTestMode(value: any): boolean {
    return ['true-false', 'choose', 'matching', 'input'].includes(value);
  }

  isAnswerMode(value: any): boolean {
    return ['title', 'description'].includes(value);
  }
}
