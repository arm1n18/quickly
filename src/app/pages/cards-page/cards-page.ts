import {CardsOverview, QuizCard} from '../../components';
import {CustomButton, Icon} from '../../components/ui';
import {NgStyle} from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy, OnInit, signal, ViewChild, WritableSignal} from '@angular/core';
import {Subject, Subscription, switchMap, takeUntil, tap, timer} from 'rxjs';
import {Module, GameMode, Card} from '../../interfaces/quizCard.interface';
import {ActivatedRoute, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';

@Component({
  selector: 'app-cards-page',
  imports: [QuizCard, CardsOverview, CustomButton, NgStyle, Icon],
  templateUrl: './cards-page.html',
  styleUrl: './cards-page.css'
})
export class CardsPage implements OnInit, OnDestroy {
  @ViewChild(QuizCard) quizCard!: QuizCard;

  private changeCardTimeout: ReturnType<typeof setTimeout> | null = null;
  private stopAutoPlay$ = new Subject<void>();
  private keySubscription = new Subscription();

  currentCardIndex: WritableSignal<number> = signal(0);
  shuffledCards: WritableSignal<Card[] | null> = signal(null);

  module: Module | undefined;
  isAutoPlayActive: boolean = false;
  isShuffleActive: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private cardsState: CardsState
  ) {}

  changeCard(action: 'next' | 'prev') {
    if (this.changeCardTimeout) {
      return;
    }

    if(action === 'prev') {
      if(this.currentCardIndex() === 0) return

      this.quizCard.triggerSlideInAnimation('right')
      this.currentCardIndex.set(Math.max(0, this.currentCardIndex() - 1))
      this.changeCardTimeout = setTimeout(() => {
        this.changeCardTimeout = null;
      }, 200)

    } else if (action === 'next') {
      if(this.currentCardIndex() === this.module!.cards.length - 1) return

      this.quizCard.triggerSlideInAnimation('left')
      this.currentCardIndex.set(Math.min(this.module!.cards.length-1, this.currentCardIndex() + 1));
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
            const last = this.module!.cards.length - 1;

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
    const newArray: Card[] = [...this.module!.cards];

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

  get currentCard(): Card {
    const shuffled = this.shuffledCards();
    const currentIndex = this.currentCardIndex();

    if (shuffled?.[currentIndex]) {
      return shuffled[currentIndex];
    }
    return this.module!.cards[currentIndex];
  }

  changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'match':
        void this.router.navigate(['match'], { relativeTo: this.route });
        break;
      case 'test':
        void this.router.navigate(['test'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }
 
  private handleKeyPress = (e: KeyboardEvent) => {
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
    this.cardsState.module$.subscribe(module => {if(module) this.module = module});

    window.addEventListener('keydown', this.handleKeyPress);
  }

  ngOnDestroy(): void {
    this.keySubscription.unsubscribe()
    window.removeEventListener('keydown', this.handleKeyPress)
  }
}
