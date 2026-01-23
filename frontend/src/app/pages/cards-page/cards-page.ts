import {CardsOverview} from '../../components';
import { CustomButton, Icon, Dropdown, DropdownItem } from '../../components/ui';
import {Component, OnInit,} from '@angular/core';
import {Module, GameMode} from '../../interfaces/quizCard.interface';
import {ActivatedRoute, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';
import { QuizCards } from "../../components/quiz-cards/quiz-cards";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { copyToClipboard } from '../../utils/clipboard';
import { Avatar } from "../../components/ui/avatar/avatar";
import { Rating } from "../../components/ui/rating/rating";
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-cards-page',
  imports: [AsyncPipe, CardsOverview, CustomButton, QuizCards, MainLayout, Icon, Dropdown, Avatar, Rating],
  templateUrl: './cards-page.html',
  styleUrl: './cards-page.css'
})
export class CardsPage implements OnInit {
  module$!: Observable<Module | null>;

  dropdownList: DropdownItem[][] = [
    [
      {title: 'Створити копію', icon: {
        name: 'Copy'
      }},
      {title: 'Друкувати', icon: {
        name: 'Print'
      }}
    ]
  ];

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

  onCopyUrl(): void {
    copyToClipboard(window.location.href);
  }

  ngOnInit(): void {
    this.module$ = this.cardsState.module$
  }
}
