import {CardsOverview} from '../../components';
import { CustomButton, Icon, Dropdown, DropdownItem } from '../../components/ui';
import {Component, OnInit, signal, WritableSignal,} from '@angular/core';
import {Module, GameMode} from '../../interfaces/quizCard.interface';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';
import { QuizCards } from "../../components/quiz-cards/quiz-cards";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { copyToClipboard } from '../../utils/clipboard';
import { Avatar } from "../../components/ui/avatar/avatar";
import { Rating } from "../../components/ui/rating/rating";
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Portal } from '../../services/portal/portal';
import { ApiService } from '../../services/api/api.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConfirmModalComponent } from '../../components/ui/confirm-modal/confirm-modal.component';

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
      {title: {text: 'Створити копію'}, onClick: () => this.dublicateModule(), icon: {
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
    private cardsState: CardsState,
    private portal: Portal,
    private api: ApiService,
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


  public openDeleteModal() {
    this.portal.open(new ComponentPortal(ConfirmModalComponent), {
      title: 'Видалити модуль?',
      description: "Ця дія є незворотною. Видалення модулю призведе до втрати всіх пов’язаних даних, які не можна буде відновити.",
      warning: "Ви дійсно хочете видалити цей модуль?",
      onConfirm: () => this.deleteModule(this.route.snapshot.paramMap)
    })
  }

  private deleteModule(params: ParamMap) {
    const id = Number(params.get("id")!)

    this.api.module.deleteModule(id)
      .subscribe(() => {
        this.router.navigate(['/'], { replaceUrl: true }),
        this.portal.close()
      })
  }

  private dublicateModule() {
   this.router.navigate(['/module/create']);
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
            { title: {text: 'Видалити', color: 'red'},
              icon: { name: 'Trash', color: 'red' },
              onClick: () => this.openDeleteModal()
            }
          ]
        ])
      }
    })
  }
}
