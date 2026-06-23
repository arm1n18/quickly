import { Component, HostListener, Input, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentPortal } from '@angular/cdk/portal';
import { AsyncPipe } from '@angular/common';
import { AvatarComponent, ButtonComponent, ConfirmModalComponent, DropdownComponent, IconComponent } from 'app/shared/ui';
import { ModuleSummary } from '../../models/module.interface';
import { DropdownItem } from 'app/shared/ui/dropdown/dropdown.component';
import { AuthStateService } from 'app/features/auth/state/auth.state';
import { ApiService } from 'app/core/api/api.service';
import { PortalService } from 'app/core/services/portal/portal.service';
import { ProfileStateService } from 'app/features/user/state/profile-state.service';

@Component({
  selector: 'app-module-item',
  imports: [
    AsyncPipe, 
    IconComponent,
    ButtonComponent,
    DropdownComponent,
    AvatarComponent,
  ],
  templateUrl: './module.component.html',
  styleUrl: './module.component.css',
})

export class ModuleComponent {
  @Input({required: true}) module: ModuleSummary | null = null;
  @Input({required: true}) href: string = '';
  @Input({required: false}) showAuthor: boolean = false;
  public isLoading: WritableSignal<boolean> = signal(false);

  public dropdownList: WritableSignal<DropdownItem[][]> = signal([
    [
      {
        title: { text: 'Редагувати' },
        icon: { name: 'Edit', color: 'var(--accent)' },
        onClick: () => this.editModule()
      },
    ],
    [
      {
        title: {text: 'Видалити', color: '#bd2e2e'}, 
        icon: { name: 'Trash', color: '#bd2e2e'},
        onClick: () => this.openDeleteModal()
      }
    ]
  ]);

  constructor(
    private auth: AuthStateService,
    private api: ApiService,
    private portal: PortalService,
    private state: ProfileStateService,
    private router: Router
  ) {}

  public toggleSaveModule(e: Event) {
    e.stopPropagation();

    if(!this.module) return
      
    const nextValue = !this.module.isSaved;

    if (!this.module.isSaved) {
      this.state.updateModuleByKey(this.module!.id, 'isSaved', nextValue)
      this.saveModule();
    } else {
      this.state.updateModuleByKey(this.module!.id, 'isSaved', nextValue)
      this.unsaveModule();
    }
  }

  private saveModule() {
    if(!this.module) return
    this.isLoading.set(true)

    this.api.module.saveModule(this.module.id)
      .subscribe({
        next: () => {
          this.isLoading.set(false)
        },
        error: () => {
          this.state.updateModuleByKey(this.module!.id, 'isSaved', false)
          this.isLoading.set(false)
        }
      })
  }

  private unsaveModule() {
    if(!this.module) return
    this.isLoading.set(true)

    this.api.module.unsaveModule(this.module.id)
      .subscribe({
        next: () => {
          this.isLoading.set(false)
        },
        error: () => {
          this.state.updateModuleByKey(this.module!.id, 'isSaved', true)
          this.isLoading.set(false)
        }
      })
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
    if(!this.module) return

    this.isLoading.set(true)

    this.api.module.deleteModule(this.module.id)
      .subscribe({
        next: () => {
          this.state.removeModule(this.module!.id)
          this.portal.close()
          this.isLoading.set(false)
        },
        error: () => {
          this.isLoading.set(false)
        }
      })
  }
  
  private editModule() {
    if(!this.module) return
    this.router.navigate([`/module/${this.module.id}/update`]);
  }

  get isAuthenticated() {
    return this.auth.isAuthenticated$
  }

  @HostListener('click')
  onClick() {
    this.router.navigate([this.href])
  }
}
