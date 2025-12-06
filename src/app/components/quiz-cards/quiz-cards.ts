import { ChangeDetectorRef, Component, EventEmitter, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { QuizCard } from "../quiz-card/quiz-card";
import { CustomButton, Icon } from "../ui";
import { Card } from '../../interfaces/quizCard.interface';
import { Subject, Subscription, switchMap, takeUntil, tap, timer } from 'rxjs';
import { NgStyle } from '@angular/common';

interface QuizCardsInterface {
  fullscreen?: boolean,
  progressBar?: boolean,
  dualBtn?: boolean
}

@Component({
  selector: 'app-quiz-cards',
  imports: [QuizCard, CustomButton, Icon, NgStyle],
  templateUrl: './quiz-cards.html',
  styleUrl: './quiz-cards.css',
})
export class QuizCards {
  @ViewChild(QuizCard) quizCard!: QuizCard;
  @Input({ required: true }) cards: Card[] = [];
  @Input() config: QuizCardsInterface = {
    fullscreen: false,
    progressBar: false,
    dualBtn: false,
  };
  @Output() quizChange = new EventEmitter<number>();

  private changeCardTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopAutoPlay$ = new Subject<void>();
  private keySubscription = new Subscription();

  currentCardIndex: WritableSignal<number> = signal(0);
  shuffledCards: WritableSignal<Card[] | null> = signal(null);
  isAutoPlayActive: boolean = false;
  isShuffleActive: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  get currentCard(): Card {
    const shuffled = this.shuffledCards();
    const currentIndex = this.currentCardIndex();

    if (shuffled?.[currentIndex]) {
      return shuffled[currentIndex];
    }
    return this.cards[currentIndex];
  }

  changeCard(action: 'next' | 'prev') {
    if (this.changeCardTimeout) {
      return;
    }

    if(action === 'prev') {
      if(this.currentCardIndex() === 0) return

      this.quizCard.triggerSlideInAnimation('right')
      const newIndex = Math.max(0, this.currentCardIndex() - 1)

      this.currentCardIndex.set(newIndex)
      this.quizChange.emit(newIndex)
      
      this.changeCardTimeout = setTimeout(() => {
        this.changeCardTimeout = null;
      }, 200)

    } else if (action === 'next') {
      if(this.currentCardIndex() === this.cards.length - 1) return

      this.quizCard.triggerSlideInAnimation('left')
      const newIndex = Math.min(this.cards.length-1, this.currentCardIndex() + 1)

      this.currentCardIndex.set(newIndex)
      this.quizChange.emit(newIndex)

      this.changeCardTimeout = setTimeout(() => {
        this.changeCardTimeout = null;
      }, 200)
    }

    if (this.isAutoPlayActive) {
      this.pauseAutoPlay();
      this.autoPlay();
    }
  }

  toggleAutoPlay() {
    if(this.isAutoPlayActive) {
      this.pauseAutoPlay()
    } else {
      this.autoPlay();
    }
  }

  autoPlay(): void {
    if (this.isAutoPlayActive) {
      return;
    }

    this.isAutoPlayActive = true;
    this.cdr.detectChanges();
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
            }else if (current === last) {
              this.pauseAutoPlay();
              this.cdr.detectChanges();
            }
          })
        );
      })
    ).subscribe();
  }

  pauseAutoPlay(): void {
    this.stopAutoPlay$.next();
    this.isAutoPlayActive = false;
    this.cdr.detectChanges();
  }

  shuffleCards() {
    const newArray: Card[] = [...this.cards];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    this.shuffledCards.set(newArray as Card[]);
    this.currentCardIndex.set(0)
  }

  toggleShuffle() {
    if(this.isShuffleActive) {
      this.shuffledCards.set(null);
      this.isShuffleActive = false;
    } else {
      this.shuffleCards();
      this.isShuffleActive = true;
    }
    this.cdr.detectChanges();
  }

  handleKeyPress = (e: KeyboardEvent) => {
    switch(e.code) {
      case "ArrowLeft" :
        this.changeCard('prev')
        break;
      case "ArrowRight" :
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
        this.cdr.detectChanges();
        break;
    }
  }

  ngOnInit(): void {
    window.addEventListener('keydown', this.handleKeyPress);
  }

  ngOnDestroy(): void {
    this.keySubscription.unsubscribe()
    window.removeEventListener('keydown', this.handleKeyPress)
  }
}
