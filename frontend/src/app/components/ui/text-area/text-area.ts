import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-text-area',
  imports: [],
  templateUrl: './text-area.html',
  styleUrl: './text-area.css',
})
export class TextArea {
  @Input() set value(val: string) {
    this._value = val || '';
    if (this.divRef) {
      this.divRef.nativeElement.innerText = this._value;
    }
  }

  @Input() set delay(value: number) {
    this._delay$.next(value ?? 500);
  }

  @Output() inputChange = new EventEmitter<string>();

  private _value = '';
  private _delay$ = new BehaviorSubject<number>(500);
  private input$ = new Subject<string>();

  @ViewChild('editableDiv', { static: true }) divRef!: ElementRef<HTMLDivElement>;

  constructor() {
    this.input$
      .pipe(debounceTime(500), takeUntilDestroyed())
      .subscribe(value => this.inputChange.emit(value || ''));
  }

  public onInputChange(event: Event) {
    const newValue = (event.target as HTMLDivElement).innerText;
    this.input$.next(newValue);
  }
}
