import {CardsOverview} from '../../components';
import {CustomButton} from '../../components/ui';
import {Component, OnInit,} from '@angular/core';
import {Module, GameMode} from '../../interfaces/quizCard.interface';
import {ActivatedRoute, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';
import { QuizCards } from "../../components/quiz-cards/quiz-cards";

@Component({
  selector: 'app-cards-page',
  imports: [CardsOverview, CustomButton, QuizCards],
  templateUrl: './cards-page.html',
  styleUrl: './cards-page.css'
})
export class CardsPage implements OnInit {
  module: Module | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardsState: CardsState
  ) {}

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


  ngOnInit(): void {
    this.cardsState.module$.subscribe(module => {if(module) this.module = module})
  }
}
