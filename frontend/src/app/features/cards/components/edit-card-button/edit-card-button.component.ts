import { Component, HostListener, inject, input, TemplateRef } from '@angular/core';
import { Card } from '../../models/cards.interface';
import { ApiService } from 'app/core/api/api.service';
import { ActivatedRoute } from '@angular/router';
import { PortalService } from 'app/core/services/portal/portal.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalComponent, IconComponent, TextAreaComponent, ButtonComponent } from 'app/shared/ui';
import { NgClass } from '@angular/common';
import { CardsState } from 'app/features/modules/state/module.state';

@Component({
  selector: 'app-edit-card-button',
  imports: [ReactiveFormsModule, NgClass, IconComponent, TextAreaComponent, ButtonComponent],
  templateUrl: './edit-card-button.component.html',
  styleUrl: './edit-card-button.component.css',
})

export class EditCardButtonComponent {
  private api = inject(ApiService);
  private state = inject(CardsState);
  private route = inject(ActivatedRoute);
  private portal = inject(PortalService);

  readonly card = input.required<Card>();
  readonly color = input<string>("var(--accent)");
  readonly size = input<number>(24);

  public submitting: boolean = false;
  public showEditModal: boolean = false;

  public form = new FormGroup<{
    title: FormControl<string>,
    description: FormControl<string>;
  }>({
    title: new FormControl('', 
      {
        nonNullable: true, 
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50)]
      }
    ),
      description: new FormControl('', 
        {
          nonNullable: true, 
          validators: [Validators.required, Validators.minLength(2), Validators.maxLength(500)]
        }
      ),
  })

  public openModal(e: PointerEvent, template: TemplateRef<any>) {
    e.stopPropagation();

    this.form.patchValue({
      title: this.card().title.text ?? '',
      description: this.card().description.text ?? ''
    });

    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Редагування',
        template: template
      }
    })
  }

  public closeModal() {
    this.portal.close()
  }

  public cancelEdit() {
    this.form.reset();
  }

  public onSubmit() {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const { title, description } = this.form.getRawValue();
    
    const body = {
      cardId: this.card().id,
      title: title,
      description: description
    }

    this.submitting = true;

    this.api.module.patchModule(id, body)
      .subscribe({
        next: () => {
          this.state.changeCard({
            id: body.cardId,
            title,
            description
          })
          this.portal.close()
        },
        complete: () => { this.submitting = false }
      })
  }

  @HostListener('click', ['$event'])
  onClick(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }
}

