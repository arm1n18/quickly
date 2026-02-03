import { Component, HostListener, Input, signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { ComponentPortal } from '@angular/cdk/portal';
import { PortalService } from '../../services/portal/portal';
import { ConfirmModalComponent, CustomButtonComponent, DropdownComponent, DropdownItem, IconComponent } from '../ui';
import { UserModule } from '../../interfaces/module.interface';

interface ModuleItemInterface extends UserModule {
  href: string;
}

@Component({
  selector: 'app-module-item',
  imports: [IconComponent, CustomButtonComponent, DropdownComponent],
  templateUrl: './module-item.html',
  styleUrl: './module-item.css',
})

export class ModuleItemComponent {
  @Input({required: true}) module: UserModule | null = null;
  @Input({required: true}) href: string = '';
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

  @HostListener('click')
  onClick() {
    this.router.navigate([this.href])
  }
}
