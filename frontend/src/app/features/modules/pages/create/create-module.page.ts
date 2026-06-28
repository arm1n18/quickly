import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { PortalModule } from "@angular/cdk/portal";
import { NgClass } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { from } from 'rxjs';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { MediaType, Card } from 'app/features/cards/models/cards.interface';
import { ApiService } from 'app/core/api/api.service';
import { HeaderComponent } from 'app/shared/components';
import { ButtonComponent, InputComponent, TextAreaComponent, IconComponent } from 'app/shared/ui';
import { isImgUrl } from 'app/shared/utils/validate.utils';
import { CardsState } from 'app/features/modules/state/module.state';
import { Module } from '../../models/module.interface';

export interface MediaForm {
  type: FormControl<MediaType | null>;
  content: FormControl<string | null>;
}

export interface ContentBlockForm {
  text: FormControl<string | null>;
  media: FormGroup<MediaForm>;
}

export interface CardForm {
  title: FormGroup<ContentBlockForm>;
  description: FormGroup<ContentBlockForm>;
}

@Component({
  selector: 'app-create-module-page',
  imports: [
    NgClass, 
    ReactiveFormsModule, 
    PortalModule, 
    HeaderComponent, 
    ImageModalDirective, 
    ButtonComponent, 
    InputComponent, 
    TextAreaComponent, 
    IconComponent,
  ],
  templateUrl: './create-module.page.html',
  styleUrl: './create-module.page.css',
})

export class CreateModulePageComponent implements OnInit {
  constructor(
    private api: ApiService,
    private router: Router,
    private module: CardsState,
    private cdr: ChangeDetectorRef
  ){}

  public moduleForm = new FormGroup<{
    title: FormControl<string>,
    description: FormControl<string | null>,
    cards: FormArray<FormGroup<CardForm>>
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)]}),
    description: new FormControl(null, {nonNullable: false, validators: [Validators.required, Validators.maxLength(500)]}),
    cards: new FormArray<FormGroup<CardForm>>([], {validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)]})
  })

  public isLoading = true;
  public loadImage: WritableSignal<{card: number, target: 'title' | 'description' | undefined}> = signal({card: -1, target: undefined});
  private isSubmitting: boolean = false;

  public addCard(index: number, data?: Card){
    const cards = this.moduleForm.controls.cards;

    if(cards.length == 50) {
      return
    }
    
    const newCard = new FormGroup<CardForm>({
      title: new FormGroup<ContentBlockForm>({
        text: new FormControl(data?.title.text || '', { nonNullable: true, validators: [Validators.required, Validators.minLength(1), Validators.maxLength(500)] }),
        media: new FormGroup<MediaForm>({
          type: new FormControl<MediaType | null>(data?.title.media?.type || null),
          content: new FormControl<string | null>(data?.title.media?.content || null),
        }),
      }),
      description: new FormGroup<ContentBlockForm>({
        text: new FormControl(data?.description.text || '', { nonNullable: true, validators: [Validators.required, Validators.minLength(1), Validators.maxLength(500)] }),
        media: new FormGroup<MediaForm>({
          type: new FormControl<MediaType | null>(data?.description.media?.type || null),
          content: new FormControl<string | null>(data?.description.media?.content || null),
        }),
      }),
    });

    cards.insert(index+1, newCard)
  }

  private duplicateModule(module: Module) {
    this.moduleForm.controls.title.patchValue(module.title)
    this.moduleForm.controls.description.patchValue(module.description)

    for(let i = 0; i < module.cards.length; i++) {
      this.addCard(i, module.cards[i])
    }
  }

  public removeCard(index: number){
    const cards = this.moduleForm.controls.cards;

    if (index >= 0 && index < cards.length) {
      cards.removeAt(index);
    }
  }

  public normalizeText(text: string): string {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\n/g, '')
      .trim();
  }

  public updateCardMediaContent(target: 'title' | 'description', index: number, value: string) {
    const card = this.cards.at(index);
    if (!card) return;

    const newValue = value.trim().length === 0 ? null : value;

    from(isImgUrl(newValue ?? ''))
      .subscribe(isImage => {
        const targetControl = card.get(target) as FormGroup | null;
        if (!targetControl) return;

        const mediaControl = targetControl.get('media') as FormGroup | null;
        if (!mediaControl) return;

        mediaControl.get('content')?.setValue(isImage ? newValue : null);
        mediaControl.get('type')?.setValue(isImage ? 'image' : null);

        if (!isImage) {
          this.loadImage.update(prev => ({ ...prev, target: undefined }));
        } else {
          setTimeout(() => {
            this.loadImage.set({ card: -1, target: undefined });
          }, 500)
        }
        this.cdr.detectChanges();
      })
  }

  public changeSelectedCard(index: number, target: "title" | "description") {
    this.loadImage.set({card: -1, target: undefined});
    this.loadImage.set({card: index, target: target})
  }

  private buildPayload() {
    return {
      title: this.moduleForm.controls.title.value,
      description: this.moduleForm.controls.description.value,
      cards: this.cards.controls.map(card => ({
        title: {
          text: card.controls.title.controls.text.value,
          media: {
            type: card.controls.title.controls.media.value.type,
            content: card.controls.title.controls.media.value.content,
          },
        },
        description: {
          text: card.controls.description.controls.text.value,
          media: {
            type: card.controls.description.controls.media.value.type,
            content: card.controls.description.controls.media.value.content,
          },
        },
      })),
    };
  }

  public onSubmit() {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    if(this.isSubmitting) return

    const payload = this.buildPayload();

    this.api.module.postModule(payload)
      .subscribe(response => this.router.navigate(['/module', response.id], { replaceUrl: true }))
  }

  get cards() {
    return this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;
  }

  get submitting() {
    return this.isSubmitting
  }

  ngOnInit() {
    const state = history.state as { duplicate?: boolean };
    const module = this.module.getModule();

    if (state?.['duplicate'] && module) {
      this.duplicateModule(module)
    } else {
      this.addCard(0)
      this.addCard(1)
    }
  }
}
