import { Component, OnInit, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { Folder } from '../../interfaces/folder.interface';
import { ApiService } from '../../services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { IconComponent, AvatarComponent, DropdownComponent, CustomButtonComponent, ConfirmModalComponent, ModalComponent, DropdownItem, CustomInputComponent } from "../../components/ui";
import { PortalService } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { UserModule } from '../../interfaces/module.interface';
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';

@Component({
  imports: [MainLayout, IconComponent, AvatarComponent, 
      DropdownComponent, 
      CustomButtonComponent, CustomInputComponent,
      ReactiveFormsModule, NgClass
    ],
  templateUrl: './folder-page.html',
  styleUrl: './folder-page.css',
})

export class FolderPage implements OnInit {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @ViewChild('modalModuleTemplate') modalModuleTemplate!: TemplateRef<any>;
  public folder: WritableSignal<Folder | null> = signal(null);
  public userModules: WritableSignal<UserModule[] | null> = signal(null);
  public isLoading: WritableSignal<boolean> = signal(false);
  public selectedModule: number = -1;

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
    private api: ApiService,
    private auth: AuthStateService,
    private route: ActivatedRoute,
    private router: Router,
    private portal: PortalService
  ){}

  public dropdownListFolder: WritableSignal<DropdownItem[][]> = signal([
    [
      {
        title: { text: 'Редагувати' },
        icon: { name: 'Edit', color: 'var(--accent)' },
        onClick: () => this.openModal()
      },
      {
        title: {text: 'Видалити', color: '#bd2e2e'}, 
        icon: { name: 'Trash', color: '#bd2e2e'},
        onClick: () => this.openDeleteModal()
      }
    ]
  ]);

  public dropdownListModule: WritableSignal<DropdownItem[][]> = signal([
    [
      {
        title: { text: 'Прибрати з папки' },
        icon: { name: 'Trash', color: 'var(--accent)' },
        onClick: () => this.removeModuleFromFolder(this.selectedModule)
      }
    ]
  ]);

  private openDeleteModal() {
    this.portal.open(new ComponentPortal(ConfirmModalComponent), {
      title: 'Видалити папку?',
      description: "Ця дія є незворотною. Видалення папки не призведе до втрати всіх пов’язаних з нею модулів.",
      warning: "Ви дійсно хочете видалити цю папку?",
      onConfirm: () => this.deleteFolder()
    })
  }

  private deleteFolder() {
    if(!this.folder() || this.isLoading()) return
    const username = this.folder()!.author.name
    if(!username) return

    this.isLoading.set(true)

    this.api.folder.deleteFolder(username, this.folder()!.slug)
      .subscribe({
        next: () => {
          this.portal.close()
          this.isLoading.set(false)

          this.router.navigate([`/user/${username}/folders`])
        },
        error: () => {
          this.isLoading.set(false)
        }
      })
  }

  public openModal() {
    this.editForm.get('title')?.setValue(this.folder()?.title || '')
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Редагування',
        template: this.modalTemplate
      }
    })
  }

  public closeModal() {
    this.portal.close()
  }

  public onSubmit() {
    const newTitle = this.editForm.get('title')?.value
    if(!newTitle || !this.folder) return
    const username = this.folder()?.author.name
    if(!username) return

    if(newTitle == this.folder()!.title) {
      this.isLoading.set(false)
      this.portal.close()
      return
    }

    this.isLoading.set(true)

    this.api.folder.updateFolder(username, this.folder()!.slug, {title: newTitle})
      .subscribe({
        next: resp => {
          const newFolder = this.folder()!

          this.folder.set({
            ...newFolder,
            title: newTitle,
            slug: resp.slug
          })

          this.isLoading.set(false)
          this.portal.close()
        },
        error: () => {
          this.isLoading.set(false)
        },
      })
    
  }

  public openAddModuleModal() {
    const username = this.auth.getPartial("username")
    if(!username) return

    this.isLoading.set(true)

    this.api.module.getUserModules(username)
      .subscribe({
        next: resp => {
          this.userModules.set(resp.modules)
          this.isLoading.set(false)
        },
        error: () => {
          this.isLoading.set(false)
        }
      })

    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Додати модуль',
        template: this.modalModuleTemplate
      }
    })
  }

  public toggleSaveModule(e: Event, index: number) {
    e.stopPropagation();

    const module = this.folder()?.modules[index]
    if (!module) return

    const nextValue = !module.isSaved;

    if (!module.isSaved) {
      const newFolder = {...this.folder()} as Folder
      newFolder.modules[index] = {
        ...newFolder.modules[index],
        isSaved: nextValue
      }
      this.folder.set(newFolder)

      this.saveModule(newFolder.modules[index].id, index);
    } else {
      const newFolder = {...this.folder()} as Folder
      newFolder.modules[index] = {
        ...newFolder.modules[index],
        isSaved: nextValue
      }
      this.folder.set(newFolder)

      this.unsaveModule(newFolder.modules[index].id, index);
    }
  }

  private saveModule(id: number, index: number) {
    this.isLoading.set(true)

    this.api.module.saveModule(id)
      .subscribe({
        next: () => {
          this.isLoading.set(false)
        },
        error: () => {
          const newFolder = {...this.folder()} as Folder
          newFolder.modules[index] = {
            ...newFolder.modules[index],
            isSaved: false
          }
          this.folder.set(newFolder)

          this.isLoading.set(false)
        }
      })
  }

  private unsaveModule(id: number, index: number) {
    this.isLoading.set(true)

    this.api.module.unsaveModule(id)
      .subscribe({
        next: () => {
          this.isLoading.set(false)
        },
        error: () => {
          const newFolder = {...this.folder()} as Folder
          newFolder.modules[index] = {
            ...newFolder.modules[index],
            isSaved: true
          }
          this.folder.set(newFolder)

          this.isLoading.set(false)
        }
      })
  }

  public openModule(link: string) {
    this.router.navigate([link])
  }

  private removeModuleFromFolder(index: number) {
    if(!this.folder()) return
    this.isLoading.set(true)

    const id = this.folder()!.modules[index].id
    const slug = this.folder()!.slug

    this.api.folder.removeModule(slug, id)
      .subscribe({
        next: () => {
          const newFolder = {...this.folder()} as Folder
          newFolder.modules = newFolder.modules.filter(m => m.id != id)
          this.folder.set(newFolder)

          this.isLoading.set(false)
        },
        error: () => {
          this.isLoading.set(false)
        }
      })
  }

  public createModule() {
    this.portal.close()
    this.router.navigate(['/module/create'])
  }

  public toggleModuleToFolder(module: UserModule) {
    const newFolder = {...this.folder()} as Folder

    if(!this.isSaved(module.id)) {
      newFolder.modules = [...newFolder.modules || [], module]
    } else {
      newFolder.modules = newFolder.modules.filter(m => m.id != module.id)
    }
    this.folder.set(newFolder)
  }

  public isSaved(id: number): boolean {
    return this.folder()?.modules.some(m => m.id == id) || false
  }

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap
    this.api.folder.getFolder(params.get('username')!, params.get('slug')!)
      .subscribe(folder => this.folder.set(folder))
  }
}
