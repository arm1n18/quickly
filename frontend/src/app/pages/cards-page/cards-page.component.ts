
import {Component, OnInit, signal, WritableSignal,} from '@angular/core';
import {Module, GameMode} from '../../interfaces/module.interface';
import {ActivatedRoute, Router} from '@angular/router';
import {CardsState} from '../../state/cards-state/cards-state';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { copyToClipboard } from '../../utils/clipboard';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PortalService } from '../../services/portal/portal';
import { ApiService } from '../../services/api/api.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { ConfirmModalComponent } from '../../components/ui/confirm-modal/confirm-modal.component';
import { DropdownItem, RatingComponent, CustomButtonComponent, IconComponent, DropdownComponent, AvatarComponent } from '../../components/ui';
import { QuizCardsComponent, CardsOverviewComponent, AuthFormComponent } from "../../components";
import { Footer } from "../../layouts/footer/footer";
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';

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
    private portal: PortalService,
    private api: ApiService,
    private auth: AuthStateService
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

  private openDeleteModal() {
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
    if(!this.auth.payload) {
      this.toggleAuthModal(true)
      return
    }
   this.router.navigate(['/module/create'], { state: { duplicate: true } });
  }

  public editModule() {
    if(!this.auth.payload) return
   this.router.navigate([`/module/${this.moduleID}/update`], { state: { update: true }});
  }

  public toggleSaveModule() {
    if(!this.auth.payload) {
      this.toggleAuthModal(true)
      return
    }

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

  private saveModule() {
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

  private unsaveModule() {
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

  private toggleAuthModal(state: boolean) {
    if (state && !this.portal.isAnyOpen()) {
      this.portal.open(new ComponentPortal(AuthFormComponent), {

      });
    } else if (!state && this.portal.isAnyOpen()) {
      this.portal.close();
    }
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
        this.dropdownList.update(([list]) => [
          [
            {
              title: { text: 'Редагувати'},
              icon: { name: 'Edit'},
              onClick: () => this.editModule()
            },
            ...list
          ]
        ]);
        this.dropdownList.update(values => [
          [
            ...values[0],
          ],
          [{ title: {text: 'Видалити', color: '#bd2e2e'},
              icon: { name: 'Trash', color: '#bd2e2e'},
              onClick: () => this.openDeleteModal()
          }]
        ])
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
