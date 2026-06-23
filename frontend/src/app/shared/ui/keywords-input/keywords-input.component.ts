import { NgClass, NgStyle } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, debounceTime, Subject } from 'rxjs';
import { IconComponent } from "../icon/icon.component";
import { DropdownService } from 'app/core/services/dropdown/dropdown.service';

export interface Keyword {
  name: string;
  slug: string;
}

@Component({
  selector: 'app-keywords-input',
  imports: [NgStyle, NgClass, IconComponent],
  templateUrl: './keywords-input.component.html',
  styleUrl: './keywords-input.component.css',
})

export class KeywordsInputComponent {
  @Input({required: true}) keywords: Keyword[] = [];
  @Input() selectedKeywords: Keyword[] = [];
  @Input() password: boolean = false;
  @Input() set delay(value: number) {
    this._delay$.next(value ?? 500);
  };
  @Input() styles: { [key: string]: any} = {};
  @Input() width: string = '100%'

  @Output() inputChange = new EventEmitter<any>();
  @Output() inputFocused = new EventEmitter<boolean>();
  @Output() keywordsChange = new EventEmitter<Keyword[]>();

  private _delay$ = new BehaviorSubject<number>(500);
  private input$ = new Subject<string>();
  public focused: boolean = false;
  private id: symbol = Symbol();

  constructor(private elementRef: ElementRef, private dropdown: DropdownService) {
    this.input$.pipe(debounceTime(this.delay), takeUntilDestroyed()).subscribe(value => {
      this.inputChange.emit(value || '');
    })
  }

  public close() {
    this.focused = false;
  }

  public onInputChange(event: Event) {
    event.preventDefault()
    event.stopPropagation();
    
    const newValue = (event.target as HTMLInputElement).value
    this.input$.next(newValue)
  }

  public onKeywordSelect(keyword: Keyword) {
    if(this.selectedKeywords.length >= 10) {
      return
    }
    
    const newArray = [...this.selectedKeywords, keyword]
    this.keywordsChange.emit(newArray);
  }

  public onKeywordRemove(keyword: Keyword) {
    const newArray = this.selectedKeywords.filter(kw => kw.slug != keyword.slug)
    this.keywordsChange.emit(newArray);
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    this.focused = clickedInside

    this.focused ? this.dropdown.open(this.id, this) : this.dropdown.close(this.id, this)

    const input = this.elementRef.nativeElement.querySelector('input')

    if(input) {
      if(clickedInside){
        input.focus()
        this.inputFocused.emit(true);
      } else {
        input.blur();
        this.inputFocused.emit(false);
      }
    }
  }
}
