import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { CustomInput } from "../../components/ui/custom-input/custom-input";
import { TextArea } from "../../components/ui/text-area/text-area";
import { Card, MediaType } from '../../interfaces/quizCard.interface';
import { CustomButton, Icon } from "../../components/ui";
import { PortalModule } from "@angular/cdk/portal";
import { NgClass } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageModalDirective } from "../../directives/imageDirective/image-modal-directive";
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

interface MediaForm {
  type: FormControl<MediaType | null>;
  content: FormControl<string | null>;
}

interface ContentBlockForm {
  text: FormControl<string>;
  media: FormGroup<MediaForm>;
}

interface CardForm {
  title: FormGroup<ContentBlockForm>;
  description: FormGroup<ContentBlockForm>;
}

@Component({
  selector: 'app-create-module-page',
  imports: [MainLayout, CustomInput, ReactiveFormsModule, TextArea, CustomButton, DragDropModule, Icon, PortalModule, NgClass, ImageModalDirective],
  templateUrl: './create-module-page.html',
  styleUrl: './create-module-page.css',
})

export class CreateModulePage implements OnInit {
  moduleForm = new FormGroup<{
    title: FormControl<string>,
    private: FormControl<boolean>,
    cards: FormArray<FormGroup<CardForm>>
  }>({
    title: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.maxLength(50)]}),
    private: new FormControl(false, {nonNullable: true, validators: [Validators.required]}),
    cards: new FormArray<FormGroup<CardForm>>([])
  })

  public loadImage: WritableSignal<'title' | 'description' | undefined> = signal(undefined);

  public addCard(index: number){
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;
    
    const newCard = new FormGroup<CardForm>({
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
    const cards = this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;

    if (index >= 0 && index < cards.length) {
      cards.removeAt(index);
    }
  }

  public changeInput(target: 'title' | 'description', index: number, text: string) {
    // const cards = [...this.cards()];
    // cards[index][target].text = this.normalizeText(text)
  }

  public normalizeText(text: string): string {
    return text
      .replace(/\u00a0/g, ' ')
      .replace(/\n/g, '')
      .trim();
  }

  public updateCardMediaContent(target: 'title' | 'description', index: number, value: string) {
    const card = this.cards.at(index);
    const newValue = value.trim().length == 0 ? null : value
    const type = newValue ? 'image' : null

    const mediaControl = card.controls[target].controls.media.controls;
    mediaControl.content.setValue(newValue);
    mediaControl.type.setValue(type);

    if(newValue == null) {
      this.loadImage.set(undefined)
    }
  }

  public dropCard(event: CdkDragDrop<FormGroup<CardForm>[]>) {
    const cardsArray = this.cards;
    moveItemInArray(cardsArray.controls, event.previousIndex, event.currentIndex);
  }

  get cards() {
    return this.moduleForm.get('cards') as FormArray<FormGroup<CardForm>>;
  }

  ngOnInit(): void {
    this.addCard(0)
    this.addCard(1)
  }
}
