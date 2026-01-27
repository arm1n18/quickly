import { Component, signal, WritableSignal } from '@angular/core';
import { CustomButton, Icon } from "../../components/ui";
import { CustomInput } from "../../components/ui/custom-input/custom-input";
import { TextArea } from "../../components/ui/text-area/text-area";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CardForm, ContentBlockForm, MediaForm } from '../create-module-page/create-module-page';
import { Card, MediaType, Module } from '../../interfaces/quizCard.interface';
import { NgClass } from '@angular/common';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal-directive";

interface UpdateCardForm extends CardForm {
  id: FormControl<number | null>;
  delete: FormControl<boolean | null>;
}

@Component({
  selector: 'app-update-module-page',
  imports: [CustomButton, Icon, CustomInput, ReactiveFormsModule, TextArea, NgClass, MainLayout, ImageModalDirective],
  templateUrl: './update-module-page.html',
  styleUrl: './update-module-page.css',
})

export class UpdateModulePage {
  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute){}

  moduleForm = new FormGroup<{
    title: FormControl<string>,
    cards: FormArray<FormGroup<UpdateCardForm>>
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(50)]}),
    cards: new FormArray<FormGroup<UpdateCardForm>>([], {validators: [Validators.required, Validators.minLength(3), Validators.maxLength(50)]})
  })



  public loadImage: WritableSignal<{card: number, target: 'title' | 'description' | undefined}> = signal({card: -1, target: undefined});
  private isSubmitting: boolean = false;

  private setModule(module: Module) {
    this.moduleForm.patchValue({
      title: module.title
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

  public addEmptyCard(index: number){
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<UpdateCardForm>>;

    if(cards.length == 50) {
      return
    }
    
    const newCard = new FormGroup<UpdateCardForm>({
      id: new FormControl<number | null>(null),
      delete: new FormControl<boolean>(false),
      title: new FormGroup<ContentBlockForm>({
        text: new FormControl('', { nonNullable: true }),
        media: new FormGroup<MediaForm>({
          type: new FormControl<MediaType | null>(null),
          content: new FormControl<string | null>(null),
        }),
      }),
      description: new FormGroup<ContentBlockForm>({
        text: new FormControl('', { nonNullable: true }),
        media: new FormGroup<MediaForm>({
          type: new FormControl<MediaType | null>(null),
          content: new FormControl<string | null>(null),
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
    const newValue = value.trim().length == 0 ? null : value
    const type = newValue ? 'image' : null

    const mediaControl = card.controls[target].controls.media.controls;
    mediaControl.content.setValue(newValue);
    mediaControl.type.setValue(type);

    if(newValue == null) {
      this.loadImage.update(prev => ({
        ...prev,
        target: undefined
      }))
    }
  }

  public changeSelectedCard(index: number, target: "title" | "description") {
    this.loadImage.set({card: -1, target: undefined});
    this.loadImage.set({card: index, target: target})
  }

  private buildPayload() {
    return {
      title: this.moduleForm.controls.title.value,
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
    
    this.apiService.module.patchModule(id, payload)
      .subscribe(_ => this.router.navigate(['/module', id], { replaceUrl: true }))
  }

  get cards() {
    return this.moduleForm.get('cards') as FormArray<FormGroup<UpdateCardForm>>;
  }

  get submitting() {
    return this.isSubmitting
  }

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap
    this.apiService.module.getModule(Number(params.get("id")!))
      .subscribe(resp => this.setModule(resp.module))
  }
}
