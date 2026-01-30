import { Component, HostListener, Input, TemplateRef, ViewChild } from '@angular/core';
import { IconComponent, CustomButtonComponent, ModalComponent, TextAreaComponent } from "../ui";
import { ApiService } from '../../services/api/api.service';
import { CardsState } from '../../state/cards-state/cards-state';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Card } from '../../interfaces/module.interface';
import { ComponentPortal } from '@angular/cdk/portal';
import { Portal } from '../../services/portal/portal';

@Component({
  selector: 'app-edit-card-button',
  imports: [IconComponent, ReactiveFormsModule, TextAreaComponent, NgClass, CustomButtonComponent],
  templateUrl: './edit-card-button.html',
  styleUrl: './edit-card-button.css',
})

export class EditCardButtonComponent {
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  @Input({required: true}) card: Card | null = null;
  @Input() color: string = "var(--accent)";
  @Input() size: number = 24;

  constructor(
    private api: ApiService,
    private cards: CardsState, 
    private route: ActivatedRoute,
    private portal: Portal
  ){}

  private isSubmitting: boolean = false;
  public showEditModal: boolean = false;

  public editForm = new FormGroup<{
    title: FormControl<string>,
    description: FormControl<string>;
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(500)]}),
    description: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(500)]}),
  })

  public openModal(e: PointerEvent) {
    e.stopPropagation;

    this.editForm.get('title')?.setValue(this.card?.title.text || '') 
    this.editForm.get('description')?.setValue(this.card?.description.text || '') 

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

  public cancelEdit() {
    this.editForm.get('title')?.setValue('');
    this.editForm.get('description')?.setValue('');
  }

  public onSubmit() {
    if(!this.card) return

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    if(this.isSubmitting) return

    const params = this.route.snapshot.paramMap
    const id = Number(params.get("id")!)
    
    const body = {
      cardId: this.card.id,
      title: this.editForm.get('title')?.value,
      description: this.editForm.get('description')?.value
    }

    this.api.module.patchModule(id, body)
      .subscribe(() => {
          this.cards.changeCard({id: body.cardId, title: body.title!, description: body.description!})
          this.portal.close()
          // this.modalState.close()
        }
      )
  }

  @HostListener('click', ['$event'])
  onClick(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }
}
