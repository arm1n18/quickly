import { ChangeDetectorRef, Component, signal, WritableSignal } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CardForm, ContentBlockForm, MediaForm } from '../create-module-page/create-module-page.component';
import { Card, MediaType, Module } from '../../interfaces/module.interface';
import { NgClass } from '@angular/common';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal.directive";
import { from } from 'rxjs';
import { isImgUrl } from '../../utils/validate';
import { CustomButtonComponent, IconComponent, CustomInputComponent, TextAreaComponent } from "../../components/ui";
import { CardsState } from '../../state/cards-state/cards-state';

interface UpdateCardForm extends CardForm {
  id: FormControl<number | null>;
  delete: FormControl<boolean | null>;
}

@Component({
  selector: 'app-update-module-page',
  imports: [ReactiveFormsModule, NgClass, MainLayoutComponent, ImageModalDirective, CustomButtonComponent, IconComponent, CustomInputComponent, TextAreaComponent],
  templateUrl: './update-module-page.html',
  styleUrl: './update-module-page.css',
})

export class UpdateModulePage {
  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private module: CardsState
  ){}

  moduleForm = new FormGroup<{
    title: FormControl<string>,
    description: FormControl<string | null>,
    cards: FormArray<FormGroup<UpdateCardForm>>
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)]}),
     description: new FormControl(null, {nonNullable: false, validators: [Validators.required, Validators.maxLength(500)]}),
    cards: new FormArray<FormGroup<UpdateCardForm>>([], {validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)]})
  })

  public loadImage: WritableSignal<{card: number, target: 'title' | 'description' | undefined}> = signal({card: -1, target: undefined});
  private isSubmitting: boolean = false;

  private setModule(module: Module) {
    this.moduleForm.patchValue({
      title: module.title,
      description: module?.description || undefined
    });

    const cards = this.moduleForm.controls.cards;
    module.cards.forEach(c => {
      cards.push(this.createCardForm(c));
    });
  }

  private createCardForm(c: Card): FormGroup<UpdateCardForm> {
    return new FormGroup<UpdateCardForm>({
      id: new FormControl<number>(c.id),
      delete: new FormControl<boolean>(false),
      title: new FormGroup<ContentBlockForm>({
        text: new FormControl<string>(c.title.text ?? ''),
        media: new FormGroup<MediaForm>({
          type: new FormControl(c.title.media?.type ?? null),
          content: new FormControl(c.title.media?.content ?? null),
        })
      }),
      description: new FormGroup<ContentBlockForm>({
        text: new FormControl<string>(c.description.text ?? ''),
        media: new FormGroup({
          type: new FormControl(c.description.media?.type ?? null),
          content: new FormControl(c.description.media?.content ?? null),
        })
      })
    });
  }

  public addCard(index: number, data?: Card){
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<UpdateCardForm>>;

    if(cards.length == 50) {
      return
    }
    
    const newCard = new FormGroup<UpdateCardForm>({
      id: new FormControl<number | null>(null),
      delete: new FormControl<boolean>(false),
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

  public removeCard(index: number){
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<UpdateCardForm>>;

    if (index >= 0 && index < cards.length) {
      cards.at(index).patchValue({delete: true})
    }
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
        id: card.controls.id.value,
        delete: card.controls.delete.value,
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

    const params = this.route.snapshot.paramMap
    const id = Number(params.get("id")!)
    
    this.api.module.putModule(id, payload)
      .subscribe(() => this.router.navigate(['/module', id], { replaceUrl: true }))
  }

  get cards() {
    return this.moduleForm.get('cards') as FormArray<FormGroup<UpdateCardForm>>;
  }

  get submitting() {
    return this.isSubmitting
  }

  ngOnInit(): void {
    const state = history.state as { update?: boolean };
    const module = this.module.getModule();

    if (state?.['update'] && module) {
      console.log(module)
      this.setModule(module)

    } else {
      const params = this.route.snapshot.paramMap
      this.api.module.getModule(Number(params.get("id")!))
        .subscribe(resp => this.setModule(resp.module))
    }
  }
}
