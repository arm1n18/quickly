import {CardsOverview} from '../../components';
import { CustomButton, Icon, Dropdown, DropdownItem } from '../../components/ui';
import {Component, OnInit, signal, WritableSignal,} from '@angular/core';
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
  
  public isLoading: WritableSignal<boolean> = signal(true);
  public module$!: Observable<Module | null>;

  public dropdownList: WritableSignal<DropdownItem[][]> = signal([
    [
      {title: {text: 'Створити копію'}, icon: {
        name: 'Copy',
        color: 'var(--accent)'
      }},
      {title: {text: 'Друкувати'}, icon: {
        name: 'Print',
        color: 'var(--accent)'
      }}
    ]
  ]);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardsState: CardsState
  ) {}

  public changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['default'], { relativeTo: this.route });
        break;
      default:
        void this.router.navigate([mode], { relativeTo: this.route });
        break;
    }
  }

  public onCopyUrl(): void {
    copyToClipboard(window.location.href);
  }

  ngOnInit(): void {
    this.module$ = this.cardsState.module$

    this.module$
    .subscribe(module => {
      if(!module) return
      this.isLoading.set(false)

      if (module.isOwner && this.dropdownList()[0].length == 2) {
        this.dropdownList.update(values => [
          [
            ...values[0],
            { title: {text: 'Видалити', color: 'red'}, icon: { name: 'Trash', color: 'red' }}
          ]
        ])
      }
    })
  }
}
