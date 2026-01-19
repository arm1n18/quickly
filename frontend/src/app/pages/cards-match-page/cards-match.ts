import {ChangeDetectorRef, Component, OnInit, signal, WritableSignal} from '@angular/core';
import {Module, GameMode, MatchCard} from '../../interfaces/quizCard.interface';
import {NgClass} from '@angular/common';
import {Subject, takeUntil, tap, timer} from 'rxjs';
import {CustomButton, Icon} from '../../components/ui';
import {CardsState} from '../../state/cards-state/cards-state';
import {ActivatedRoute, Router} from '@angular/router';
import { DropdownItem, Dropdown } from '../../components/ui/dropdown/dropdown';

@Component({
  selector: 'app-cards-match',
  imports: [
    NgClass,
    CustomButton,
    Icon,
    Dropdown
],
  templateUrl: './cards-match.html',
  styleUrl: './cards-match.css'
})
export class CardsMatch implements OnInit {
  private stopTimer$ = new Subject<void>();

  MatchCards: WritableSignal<MatchCard[]> = signal([]);
  qaPair: WritableSignal<MatchCard[]> = signal([]);
  matched: WritableSignal<boolean | null> = signal(null);
  matchedQT: WritableSignal<number> = signal(0);
  timer: WritableSignal<{ s: number, ms: number }> = signal({ s: 0, ms: 0 });

  private currentModule: WritableSignal<Module | null> = signal(null);

  public dropdownList: DropdownItem[][] = [
    [
      { title: 'Картки', onClick: () => this.changeGameMode('flashcards'), icon : {
        name: 'Slider',
        color: 'var(--accent)'
      } },
      { title: 'Підбір', preselected: true, onClick: () => this.changeGameMode('match'), icon: {
        name: 'Notes',
        color: 'var(--accent)'
      } },
      { title: 'Тестування', onClick: () => this.changeGameMode('test'), icon: {
        name: 'Document',
        color: 'var(--accent)'
      } }
    ],
    [
      { title: 'Головна', onClick: () => this.changeGameMode('default'), icon: {
        name: 'House',
        color: 'var(--accent)'
        } 
      }
    ]
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private cardsState: CardsState
  ) {}

  generateMatchCards() {
    const randomArray = this.shuffleCards(this.currentModule()!.cards).slice(0, 6);

    this.MatchCards.set(
      this.shuffleCards(randomArray.flatMap((card, id) => [{
        id: `${id}-q`,
        type: 'question',
        content: card.title,
        pair: card.description,
        match: false
      }, {
        id: `${id}-a`,
        type: 'answer',
        content: card.description,
        pair: card.title,
        match: false
      }]))
    );
  }

  shuffleCards<T>(array: T[]): T[] {
    const newArray: T[] = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
  }

  toggleMatchCard(MatchCard: MatchCard) {
    const current = this.qaPair();

    if(MatchCard.match) {
      return
    }

    if(MatchCard == current[0]) {
      this.qaPair.set([])
      return
    }

    if (current.length < 1) {
      this.qaPair.set([MatchCard]);
    } else if(current.length === 1) {
      const updated = [...current, MatchCard];
      this.qaPair.set(updated);

      const [first, second] = updated;

      const isPair = (first.content.text === second.pair.text
        && second.content.text === first.pair.text);

      if(isPair) {
        this.qaPair.set(updated);
        this.matched.set(true);
        this.matchedQT.set(this.matchedQT() + 1)

        if(this.matchedQT() === this.MatchCards().length/2) {
          this.stopTimer();
        }

        setTimeout(() => {
          this.qaPair.set([]);
          this.matched.set(null);
          this.MatchCards().map(c => {
            if (c.id == first.id || c.id == second.id) {
              c.match = true
            }
          });

        }, 200);
      } else {
        this.matched.set(false);

        setTimeout(() => {
          this.matched.set(null);
          this.qaPair.set([]);
        }, 200);
      }
    }
  }

  isSelected(id: string): boolean {
    return this.qaPair().some(c => c.id === id);
  }

  startTimer(): void {
    const start = performance.now();

    timer(0,100).pipe(
      takeUntil(this.stopTimer$),
      tap(() => {
        const elapsed = performance.now() - start;

        const totalMs = Math.floor(elapsed);
        const s = Math.floor(totalMs / 1000);
        const ms = Math.floor((totalMs % 1000) / 100);

        this.timer.set({ s, ms });
        this.cdr.detectChanges(); // TODO_CHECK_IF_CDR_NECESSARY
      })
    ).subscribe();
  }

  stopTimer(): void {
    this.stopTimer$.next();
  }

  playAgain(): void {
    this.timer.set({ s: 0, ms: 0 });
    this.matchedQT.set(0);
    this.matched.set(null);
    this.generateMatchCards();
    this.startTimer();
  }

  changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      case 'test':
        void this.router.navigate(['../test'], { relativeTo: this.route });
        break;
      case 'flashcards':
        void this.router.navigate(['../flashcards'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }

  ngOnInit(): void {
    this.cardsState.module$.subscribe(module => {
      if(!module) return 
      this.currentModule.set(module);

      this.generateMatchCards();
      this.startTimer();
    });
  }
}
