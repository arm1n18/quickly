import { Component, computed, EventEmitter, HostListener, inject, input, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { Router } from '@angular/router';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subject, switchMap, takeUntil, tap, timer } from 'rxjs';
import { ButtonComponent, DropdownComponent, IconComponent, ModalComponent } from 'app/shared/ui';
import { CardComponent } from '../card/card.component';
import { PortalService } from 'app/core/services/portal/portal.service';
import { Card } from '../../models/cards.interface';
import { DropdownItem } from 'app/shared/ui/dropdown/dropdown.component';

interface QuizCardsInterface {
  side: sideType,
  canEdit: boolean,
  fullscreen: boolean,
  progressBar: boolean,
  dualBtn: boolean,
}


type sideType = 'title' | 'description' | 'both'

@Component({
  selector: 'app-cards',
  imports: [
    NgStyle, 
    NgClass, 
    ButtonComponent, 
    IconComponent, 
    DropdownComponent,
    CardComponent,
  ],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css',
})

export class CardsComponent {
  private router = inject(Router);
  private portal = inject(PortalService);

  readonly cards = input.required<Card[]>();
  readonly configInput = input<Partial<QuizCardsInterface>>({});
  readonly config = computed<QuizCardsInterface>(() => ({
    side: 'title',
    canEdit: false,
    fullscreen: false,
    progressBar: false,
    dualBtn: false,
    ...this.configInput(),
  }));

  readonly index = signal(0);
  readonly shuffleEnabled = signal(false);
  readonly autoPlayEnabled = signal(false);

  private cardTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopAutoPlay$ = new Subject<void>();

  readonly shuffled = signal<Card[] | null>(null);

  readonly currentCards = computed(() =>
    this.shuffled() ?? this.cards()
  );

  readonly currentCard = computed(() =>
    this.currentCards()[this.index()]
  );

  readonly isLast = computed(() =>
    this.index() === this.currentCards().length - 1
  );

  readonly isFirst = computed(() =>
    this.index() === 0
  );


  public shortcut: boolean = false;
  public dropdownList: DropdownItem[][] = [
    [
      {
        title: {text: 'Термін'}, 
        preselected: this.config().side === 'title',
        onClick: () => this.config().side = 'title',
      },
      { 
        title: {text: 'Визначення'}, 
        preselected: this.config().side === 'description',
        onClick: () => this.config().side = 'description',
      }
    ]
  ]

  @ViewChild(CardComponent) card!: CardComponent;
  @Output() indexChange = new EventEmitter<number>();

  public changeCard(dir: 'next' | 'prev') {
    if (this.cardTimeout) return

    const cards = this.currentCards();

    const nextIndex = 
      dir === 'next'
        ? Math.min(cards.length - 1, this.index() + 1)
        : Math.max(0, this.index() - 1)

    if (nextIndex === this.index()) return;

    this.index.set(nextIndex);
    this.indexChange.emit(nextIndex);

    this.cardTimeout = setTimeout(() => {
      this.cardTimeout = null;
    }, 200)

    if (this.autoPlayEnabled()) {
      this.pauseAutoPlay();
      this.autoPlay();
    }
  }

  public toggleAutoPlay() {
    if (this.autoPlayEnabled()) {
      this.pauseAutoPlay()
    } else {
      this.autoPlay();
    }
  }

  private autoPlay(): void {
    if (this.autoPlayEnabled()) {
      return;
    }

    this.autoPlayEnabled.set(true)
    this.stopAutoPlay$.next();

    timer(2000, 4000).pipe(
      takeUntil(this.stopAutoPlay$),
      switchMap(() => {
        this.card.toggleFlip(true);

        return timer(2000).pipe(
          takeUntil(this.stopAutoPlay$),
          tap(() => {
            const current = this.index();
            const last = this.cards.length - 1;

            if (current < last) {
              this.changeCard('next');
            } else if (current === last) {
              this.pauseAutoPlay();
            }
          })
        );
      })
    ).subscribe();
  }

  private pauseAutoPlay(): void {
    this.stopAutoPlay$.next();
    this.autoPlayEnabled.set(false)
  }

  private shuffleCards() {
    const newArray: Card[] = [...this.cards()];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    this.shuffled.set(newArray as Card[]);
    this.index.set(0)
  }

  public toggleShuffle() {
    this.index.set(0)
    
    if (this.shuffleEnabled()) {
      this.shuffled.set(null);
      this.shuffleEnabled.set(false)
    } else {
      this.shuffleCards();
      this.shuffleEnabled.set(true)
    }
  }

  public openFullScreen() {
    this.router.navigate([`/${this.router.url}/flashcards`]);
  }

  public openModal(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Параметри',
        template: template,
      }
    })
  }


  @HostListener('window:keydown', ['$event'])
  handleKeyPress (e: KeyboardEvent) {
    const target = e.target as HTMLElement;

    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    if (this.portal.isAnyOpen()) return;

    switch (e.code) {
      case "ArrowLeft":
        this.changeCard('prev')
        break;
      case "ArrowRight":
        this.changeCard('next')
        break;
      case "Space":
        e.preventDefault();
        this.card.toggleFlip()
        break;
      case "KeyP":
        e.preventDefault();
        this.toggleAutoPlay()
        break;
      case "KeyS":
        e.preventDefault();
        this.toggleShuffle();
        break;
      case "KeyA":
        e.preventDefault();
        this.card.speakText(e);
        break;
      case "KeyC":
        e.preventDefault();
        this.card.toggleClue(e);
        break;
    }
  }
}
