import { Component, EventEmitter, HostListener, Input, Output, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { CustomButton, Icon, Dropdown, DropdownItem, ModalComponent } from "../ui";
import { Card } from '../../interfaces/quizCard.interface';
import { Subject, switchMap, takeUntil, tap, timer } from 'rxjs';
import { NgClass, NgStyle } from '@angular/common';
import { QuizCard } from "../quiz-card/quiz-card";
import { Router } from '@angular/router';
import { Portal } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';

interface QuizCardsInterface {
  side: sideType,
  canEdit: boolean,
  fullscreen: boolean,
  progressBar: boolean,
  dualBtn: boolean,
  dualCard: boolean,
}

interface IsActiveInterface {
  isAutoPlayActive: boolean;
  isShuffleActive: boolean;
}

type sideType = 'title' | 'description' | 'both'

@Component({
  selector: 'app-quiz-cards',
  imports: [CustomButton, Icon, NgStyle, QuizCard, Dropdown, NgClass],
  templateUrl: './quiz-cards.html',
  styleUrl: './quiz-cards.css',
})

export class QuizCards {
  constructor(
    private router: Router,
    private portal: Portal
  ){}

  private _config: QuizCardsInterface = {
    side: 'title',
    canEdit: false,
    fullscreen: false,
    progressBar: false,
    dualBtn: false,
    dualCard: false
  };

  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @ViewChild(QuizCard) quizCard!: QuizCard;
  @Input({ required: true }) cards: Card[] = [];
  @Input() set config(value: Partial<QuizCardsInterface>) {
    this._config = { ...this._config, ...value }
  }
  @Output() quizChange = new EventEmitter<number>();

  private changeCardTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopAutoPlay$ = new Subject<void>();

  public currentCardIndex: WritableSignal<number> = signal(0);
  private shuffledCards: WritableSignal<Card[] | null> = signal(null);
  public isActive: WritableSignal<IsActiveInterface> = signal({
    isAutoPlayActive: false,
    isShuffleActive: false
  })

  public shortcut: boolean = false;

  public dropdownList: DropdownItem[][] = [
    [
      { title: {text: 'Термін'}, onClick: () => this.config.side = 'title', preselected: this.config.side === 'title' },
      { title: {text: 'Визначення'}, onClick: () => this.config.side = 'description', preselected: this.config.side === 'description' }
    ]
  ]

  public changeCard(action: 'next' | 'prev') {
    if (this.changeCardTimeout) return

    if (action === 'prev') {
      if (this.currentCardIndex() === 0) return

      this.quizCard.triggerSlideInAnimation('right')
      const newIndex = Math.max(0, this.currentCardIndex() - 1)

      this.currentCardIndex.set(newIndex)
      this.quizChange.emit(newIndex)
    } else if (action === 'next') {
      if (this.currentCardIndex() === this.cards.length - 1) return

      this.quizCard.triggerSlideInAnimation('left')
      const newIndex = Math.min(this.cards.length - 1, this.currentCardIndex() + 1)

      this.currentCardIndex.set(newIndex)
      this.quizChange.emit(newIndex)
    }

    this.changeCardTimeout = setTimeout(() => {
      this.changeCardTimeout = null;
    }, 200)

    if (this.isActive().isAutoPlayActive) {
      this.pauseAutoPlay();
      this.autoPlay();
    }
  }

  public toggleAutoPlay() {
    if (this.isActive().isAutoPlayActive) {
      this.pauseAutoPlay()
    } else {
      this.autoPlay();
    }
  }

  private autoPlay(): void {
    if (this.isActive().isAutoPlayActive) {
      return;
    }

    this.isActive.update(current => ({
      ...current,
      isAutoPlayActive: true
    }))
    this.stopAutoPlay$.next();

    timer(2000, 4000).pipe(
      takeUntil(this.stopAutoPlay$),
      switchMap(() => {
        this.quizCard.toggleFlip(true);

        return timer(2000).pipe(
          takeUntil(this.stopAutoPlay$),
          tap(() => {
            const current = this.currentCardIndex();
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
    this.isActive.update(current => ({
      ...current,
      isAutoPlayActive: false
    }))
  }

  private shuffleCards() {
    const newArray: Card[] = [...this.cards];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    this.shuffledCards.set(newArray as Card[]);
    this.currentCardIndex.set(0)
  }

  public toggleShuffle() {
    if (this.isActive().isShuffleActive) {
      this.shuffledCards.set(null);
      this.isActive.update(current => ({
        ...current,
        isShuffleActive: false
      }))
    } else {
      this.shuffleCards();
      this.isActive.update(current => ({
        ...current,
        isShuffleActive: true
      }))
    }
  }

  public openFullScreen() {
    this.router.navigate([`/${this.router.url}/flashcards`]);
  }

  public openModal() {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Параметри',
        template: this.modalTemplate,
      }
    })
  }

  get currentCard(): Card {
    const shuffled = this.shuffledCards();
    const currentIndex = this.currentCardIndex();

    if (shuffled?.[currentIndex]) {
      return shuffled[currentIndex];
    }
    return this.cards[currentIndex];
  }

  get config(): QuizCardsInterface {
    return this._config;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyPress (e: KeyboardEvent) {
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
        this.quizCard.toggleFlip()
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
        this.quizCard.speakText(e);
        break;
      case "KeyC":
        e.preventDefault();
        this.quizCard.toggleClue(e);
        break;
    }
  }
}
