import { Component, EventEmitter, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-text-area',
  imports: [],
  templateUrl: './text-area.html',
  styleUrl: './text-area.css',
})
export class TextArea {
  @Input() value: any;
  @Input() set delay(value: number) {
    this._delay$.next(value ?? 500);
  };
  @Output() inputChange = new EventEmitter<any>();
  private _delay$ = new BehaviorSubject<number>(500);
  private input$ = new Subject<string>();

  constructor() {
    this.input$.pipe(debounceTime(this.delay), takeUntilDestroyed()).subscribe(value => {
      this.inputChange.emit(value || '');
    })
  }

  public onInputChange(event: Event) {
    const newValue = (event.target as HTMLDivElement).innerText
    this.input$.next(newValue)
  }
}
