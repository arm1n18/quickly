
import {Component, computed, inject, signal } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { copyToClipboard } from 'app/shared/utils/clipboard.utils';
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
import { toSignal } from '@angular/core/rxjs-interop';
import { CardsState } from 'app/features/modules/state/module.state';

@Component({
  standalone: true,
  selector: 'app-cards-page',
  imports: [
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

export class CardsStudyPageComponent { 
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private state = inject(CardsState);
  private api = inject(ApiService);
  private portal = inject(PortalService);
  private auth = inject(AuthStateService);
   
  public isSaveLoading = signal(false);
  public isModuleLoading = computed(() => this.module() === null);
  readonly module = toSignal(this.state.module$, { initialValue: null });

  public dropdownList = computed<DropdownItem[][]>(() => {
    const module = this.module();
    
    const base: DropdownItem[] = [
      {
        title: { text: 'Створити копію' },
        icon: { name: 'Copy' },
        onClick: () => this.duplicateModule()
      },
      {
        title: { text: 'Друкувати' },
        icon: { name: 'Print' }
      }
    ];

    const owner: DropdownItem[] = [
      {
        title: { text: 'Редагувати' },
        icon: { name: 'Edit' },
        onClick: () => this.editModule()
      }
    ];

    const danger: DropdownItem[] = [
      {
        title: { text: 'Видалити', color: '#bd2e2e' },
        icon: { name: 'Trash', color: '#bd2e2e' },
        onClick: () => this.openDeleteModal()
      }
    ];

    return module?.isOwner
      ? [[...owner, ...base], danger]
      : [base];

  });

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

  private openDeleteModal() {
    this.portal.open(new ComponentPortal(ConfirmModalComponent), {
      title: 'Видалити модуль?',
      description: "Ця дія є незворотною. Видалення модулю призведе до втрати всіх пов’язаних даних, які не можна буде відновити.",
      warning: "Ви дійсно хочете видалити цей модуль?",
      onConfirm: () => this.deleteModule()
    })
  }

  private deleteModule() {
    const id = this.module()?.id;
    if(!id || !this.auth.payload) return

    this.api.module.deleteModule(id)
      .subscribe(() => {
        this.router.navigate(['/'], { replaceUrl: true }),
        this.portal.close()
      })
  }

  private duplicateModule() {
    if(!this.auth.payload) {
      this.toggleAuthModal(true)
      return
    }

   this.router.navigate(['/module/create'], { state: { duplicate: true } });
  }

  public editModule() {
    const id = this.module()?.id;
    if(!id || !this.auth.payload) return

    this.router.navigate([`/module/${id}/update`], { state: { update: true }});
  }

  public toggleSaveModule() {
    if(!this.auth.payload) {
      this.toggleAuthModal(true)
      return
    }

    if (this.isSaveLoading()) return;

    const module = this.module();
    const id = this.module()?.id;
    if (!module || !id || this.isSaveLoading()) return;

    const nextValue = !module.isSaved;

    this.isSaveLoading.set(true)
    this.state.updateModuleByKey("isSaved", nextValue);

    this.toggleSaveRequest(id, nextValue);
  }

  private toggleSaveRequest(id: number, nextValue: boolean) {
    const request$ = nextValue
      ? this.api.module.saveModule(id)
      : this.api.module.unsaveModule(id)

    request$.subscribe({
        error: () => {
          this.state.updateModuleByKey("isSaved", !nextValue)
        },
        complete: () => {this.isSaveLoading.set(false)}
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

  public onCopyUrl(): void {
    copyToClipboard(window.location.href);
  }
}