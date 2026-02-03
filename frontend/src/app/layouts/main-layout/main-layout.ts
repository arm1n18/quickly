import { Component, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { AvatarComponent, CustomButtonComponent, CustomInputComponent, DropdownItem, IconComponent, DropdownComponent, ModalComponent } from "../../components/ui";
import { ModuleSummary } from '../../interfaces/module.interface';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';
import { AsyncPipe, NgClass } from '@angular/common';
import { PortalService } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { AuthFormComponent } from '../../components';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserAvatarComponent } from "../../components/user-avatar/user-avatar.component";

@Component({
  selector: 'app-main-layout',
  imports: [AsyncPipe, CustomButtonComponent, IconComponent, CustomInputComponent,
    ReactiveFormsModule, AvatarComponent, DropdownComponent, NgClass, UserAvatarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @ViewChild('loginModal') loginModal!: TemplateRef<any>;
  
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  public showSearchDropdown: boolean = false;
  public isLoading: boolean = false;

  public dropdownList: WritableSignal<DropdownItem[][]> = signal([
    [
      {
        title: {text: 'Модуль'}, icon: { name: 'Notes', color: 'var(--accent)' },
        onClick: () => this.addModule(),
      },
      {
        title: {text: 'Папку'}, icon: { name: 'Folder', color: 'var(--accent)' },
        onClick: () => this.openFolderModal(),
      }
    ]
  ]);

  public editForm = new FormGroup<{
    title: FormControl<string>,
  }>({
    title: new FormControl('', {
      nonNullable: true, 
      validators: [
        Validators.required, Validators.minLength(2), Validators.maxLength(50)
      ]}),
  })

  constructor(
    public auth: AuthStateService,
    private api: ApiService,
    private router: Router,
    private portal: PortalService
  ) {}

  public findModules(text: string) {
    if(text.length == 0) return

    this.api.module.getModuleByName(text)
      .subscribe(resp => this.modules.set(resp.modules))
  }

  public navigateToModule(id: number, e: Event) {
    e.stopPropagation()
    this.router.navigate([`/module/${id}`])
  }

  public toggleAuthModal(state: boolean) {
    if (state && !this.portal.isAnyOpen()) {
      this.portal.open(new ComponentPortal(AuthFormComponent), {

      });
    } else if (!state && this.portal.isAnyOpen()) {
      this.portal.close();
    }
  }

  public addModule() {
    if(!this.auth.payload) {
      this.toggleAuthModal(true)
    } else {
      this.router.navigate(["/module/create"])
    }
  }

  public openFolderModal() {
      this.portal.open(new ComponentPortal(ModalComponent), {
        config: {
          showCross: true,
          title: 'Створити папку',
          template: this.modalTemplate
        }
      })
  }

  public closeFolderModal() {
    this.portal.close();
    this.editForm.patchValue({title: ''})
  }

  public onFolderSubmit(e: Event) {
    e.preventDefault();

    if(!this.editForm.valid) return
    
    const newTitle = this.editForm.get('title')!.value
    const username = this.auth.getPartial("username")
    if(!username) return

    this.isLoading = true

    this.api.folder.createFolder(username, {title: newTitle})
      .subscribe({
        next: resp => {
          this.isLoading = false
          this.portal.close()

          this.router.navigate([`user/${username}/folder/${resp.slug}`])
        },
        error: () => {
          this.isLoading = false
        },
      })
    
  }
}
