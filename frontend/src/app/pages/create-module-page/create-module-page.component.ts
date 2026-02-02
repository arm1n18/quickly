import { ChangeDetectorRef, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { Card, MediaType, Module } from '../../interfaces/module.interface';
import { PortalModule } from "@angular/cdk/portal";
import { NgClass } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal.directive";
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';
import { isImgUrl } from '../../utils/validate';
import { from } from 'rxjs';
import { CardsState } from '../../state/cards-state/cards-state';
import { CustomButtonComponent, CustomInputComponent, TextAreaComponent, IconComponent } from "../../components/ui";

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
  imports: [MainLayout, ReactiveFormsModule, DragDropModule, PortalModule, NgClass, ImageModalDirective, CustomButtonComponent, CustomInputComponent, TextAreaComponent, IconComponent],
  templateUrl: './create-module-page.html',
  styleUrl: './create-module-page.css',
})

export class CreateModulePage implements OnInit {
  constructor(
    private api: ApiService,
    private router: Router,
    private module: CardsState,
    private cdr: ChangeDetectorRef
  ){}

  moduleForm = new FormGroup<{
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
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;

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

  private dublicateModule(module: Module) {
    this.moduleForm.get('title')?.setValue(module.title)
    this.moduleForm.get('description')?.setValue(module.description)
    for(let i = 0; i < module.cards.length; i++) {
      this.addCard(i, module.cards[i])
    }
  }

  public removeCard(index: number){
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;

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

  public dropCard(event: CdkDragDrop<FormGroup<CardForm>[]>) {
    const cardsArray = this.cards;
    moveItemInArray(cardsArray.controls, event.previousIndex, event.currentIndex);
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
      this.dublicateModule(module)
    } else {
      this.addCard(0)
      this.addCard(1)
    }
  }
}
