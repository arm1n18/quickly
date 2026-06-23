
import {Component, OnInit, signal, WritableSignal,} from '@angular/core';
import {Module} from '../../../modules/models/module.interface';
import {ActivatedRoute, Router} from '@angular/router';
import { CardsState } from 'app/features/modules/state/module.state';
import { copyToClipboard } from 'app/shared/utils/clipboard.utils';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { PortalService } from 'app/core/services/portal/portal.service';
import { ApiService } from 'app/core/api/api.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { AuthStateService } from 'app/features/auth/state/auth.state';
import { DropdownItem, DropdownComponent } from 'app/shared/ui/dropdown/dropdown.component';
import { GameMode } from 'app/features/test/models/test-card.interface';
import { ConfirmModalComponent, RatingComponent, ButtonComponent, IconComponent, AvatarComponent } from 'app/shared/ui';
import { AuthFormComponent } from 'app/features/auth/components';
import { HeaderComponent, FooterComponent } from "app/shared/components";
import { CardsComponent, OverviewComponent } from "../../components";

interface isLoadingInterface {
  module: boolean;
  save: boolean;
}

@Component({
  standalone: true,
  selector: 'app-cards-page',
  imports: [
    AsyncPipe,
    HeaderComponent,
    RatingComponent,
    ButtonComponent,
    IconComponent,
    DropdownComponent,
    CardsComponent,
    OverviewComponent,
    FooterComponent,
    AvatarComponent
],
  templateUrl: './cards-study.page.html',
  styleUrl: './cards-study.page.css'
})

export class CardsStudyPageComponent implements OnInit { 
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
      }},
      {title: {text: 'Друкувати'}, icon: {
        name: 'Print',
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

    this.route.data.subscribe(d => console.log(d))
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
