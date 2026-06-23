import { Component, HostListener, Input, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComponentPortal } from '@angular/cdk/portal';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FolderSummary } from '../../models/folder.interface';
import { ButtonComponent, ConfirmModalComponent, DropdownComponent, IconComponent, InputComponent, ModalComponent } from 'app/shared/ui';
import { DropdownItem } from 'app/shared/ui/dropdown/dropdown.component';
import { ApiService } from 'app/core/api/api.service';
import { PortalService } from 'app/core/services/portal/portal.service';
import { ProfileStateService } from 'app/features/user/state/profile-state.service';

@Component({
  selector: 'app-folder',
  imports: [
    NgClass, 
    IconComponent, 
    ButtonComponent, 
    DropdownComponent, 
    InputComponent, 
    ReactiveFormsModule,
  ],
  templateUrl: './folder.component.html',
  styleUrl: './folder.component.css',
})

export class FolderComponent {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @Input({required: true}) folder: FolderSummary | null = null;
  @Input({required: true}) href: string = '';
  public isLoading: WritableSignal<boolean> = signal(false);

  public editForm = new FormGroup<{
    title: FormControl<string>,
  }>({
    title: new FormControl('', {
      nonNullable: true, 
      validators: [
        Validators.required, Validators.minLength(2), Validators.maxLength(50)
      ]}),
  })

  // public dropdownList: WritableSignal<DropdownItem[][]> = signal([
  public dropdownList: DropdownItem[][] = [
  [
      {
        title: { text: 'Редагувати' },
        icon: { name: 'Edit', color: 'var(--accent)' },
        onClick: () => this.openModal()
      },
    ],
    [
      {
        title: {text: 'Видалити', color: '#bd2e2e'}, 
        icon: { name: 'Trash', color: '#bd2e2e' },
        onClick: () => this.openDeleteModal()
      }
    ]
  ];

  constructor(
    private api: ApiService,
    private portal: PortalService,
    private state: ProfileStateService,
    private router: Router,
  ) {}

  private openDeleteModal() {
    this.portal.open(new ComponentPortal(ConfirmModalComponent), {
      title: 'Видалити папку?',
      description: "Ця дія є незворотною. Видалення папки не призведе до втрати всіх пов’язаних з нею модулів.",
      warning: "Ви дійсно хочете видалити цю папку?",
      onConfirm: () => this.deleteFolder()
    })
  }

  private deleteFolder() {
    if(!this.folder || this.isLoading()) return

    const username = this.state.getUserByKey("name")
    if(!username) return

    this.isLoading.set(true)

    this.api.folder.deleteFolder(username, this.folder.slug)
      .subscribe({
        next: () => {
          this.state.removeFolder(this.folder!.slug)
          this.portal.close()
          this.isLoading.set(false)
        },
        error: () => {
          this.isLoading.set(false)
        }
      })
  }

  public openModal() {
    this.editForm.get('title')?.setValue(this.folder?.title || '')
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
    const username = this.state.getUserByKey("name")
    if(!username) return

    if(newTitle == this.folder.title) {
      this.isLoading.set(false)
      this.portal.close()
      return
    }

    this.isLoading.set(true)

    this.api.folder.updateFolder(username, this.folder!.slug, {title: newTitle})
      .subscribe({
        next: resp => {
          const current = {...this.folder} as FolderSummary

          this.state.updateFolder(current.slug, {
            id: current.id,
            title: newTitle!,
            slug: resp.slug,
            objects: current.objects ?? 0,
            isOwner: current.isOwner ?? false
          })

          this.isLoading.set(false)
          this.portal.close()
        },
        error: () => {
          this.isLoading.set(false)
        },
      })
    
  }

  @HostListener('click')
  onClick() {
    this.router.navigate([this.href])
  }
}
