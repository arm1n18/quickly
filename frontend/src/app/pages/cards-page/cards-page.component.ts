
import {Component, OnInit, signal, WritableSignal,} from '@angular/core';
import {Module, GameMode} from '../../interfaces/module.interface';
import {ActivatedRoute, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { copyToClipboard } from '../../utils/clipboard';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { Portal } from '../../services/portal/portal';
import { ApiService } from '../../services/api/api.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConfirmModalComponent } from '../../components/ui/confirm-modal/confirm-modal.component';
import { DropdownItem, RatingComponent, CustomButtonComponent, IconComponent, DropdownComponent, AvatarComponent } from '../../components/ui';
import { QuizCardsComponent, CardsOverviewComponent } from "../../components";
import { Footer } from "../../layouts/footer/footer";

interface isLoadingInterface {
  module: boolean;
  save: boolean;
}

@Component({
  standalone: true,
  selector: 'app-cards-page',
  imports: [AsyncPipe, MainLayout, RatingComponent, CustomButtonComponent,
    IconComponent, DropdownComponent, QuizCardsComponent, AvatarComponent, CardsOverviewComponent, Footer],
  templateUrl: './cards-page.html',
  styleUrl: './cards-page.css'
})

export class CardsPage implements OnInit { 
  private destroy$ = new Subject<void>();
   
  public isLoading: WritableSignal<isLoadingInterface> = signal({
    module: true,
    save: false
  });
  public module$!: Observable<Module | null>;
  private moduleID = -1;

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
      onConfirm: () => this.deleteModule()
    })
  }

  private deleteModule() {
    this.api.module.deleteModule(this.moduleID)
      .subscribe(() => {
        this.router.navigate(['/'], { replaceUrl: true }),
        this.portal.close()
      })
  }

  private dublicateModule() {
   this.router.navigate(['/module/create']);
  }

  public editModule() {
   this.router.navigate([`/module/${this.moduleID}/update`]);
  }


  public toggleSaveModule() {
    this.cardsState.module$
    .pipe(take(1))
    .subscribe(module => {
      if (!module || this.isLoading().save) return;

      const nextValue = !module.isSaved;
      this.cardsState.updateModuleByKey("isSaved", nextValue);

      if (!module.isSaved) {
        this.saveModule();
      } else {
        this.unsaveModule();
      }
    });
  }

  public saveModule() {
    this.isLoading.update(prev => ({...prev, save: true}))

    this.api.module.saveModule(this.moduleID)
      .subscribe({
        next: () => {
          this.isLoading.update(prev => ({...prev, save: false}))
        },
        error: () => {
          this.cardsState.updateModuleByKey("isSaved", false)
          this.isLoading.update(prev => ({...prev, save: false}))
        }
      })
  }

  public unsaveModule() {
    this.isLoading.update(prev => ({...prev, save: true}))

    this.api.module.unsaveModule(this.moduleID)
      .subscribe({
        next: () => {
          this.isLoading.update(prev => ({...prev, save: false}))
        },
        error: () => {
          this.cardsState.updateModuleByKey("isSaved", true)
          this.isLoading.update(prev => ({...prev, save: false}))
        }
      })
  }

  ngOnInit(): void {
    this.module$ = this.cardsState.module$

    this.module$
    .pipe(takeUntil(this.destroy$))
    .subscribe(module => {
      if(!module) return
      this.moduleID = module.id
      this.isLoading.update(prev => ({
        ...prev,
        module: false
      }))

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
