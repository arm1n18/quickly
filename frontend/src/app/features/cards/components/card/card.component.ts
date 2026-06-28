import {Component, computed, input, Input, OnChanges, signal, SimpleChanges, WritableSignal} from '@angular/core';
import { NgClass } from '@angular/common';
import { IconComponent } from '../../../../shared/ui';
import { ContentBlock } from '../../models/cards.interface';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { EditCardButtonComponent } from '../edit-card-button/edit-card-button.component';

interface QuizCardProps {
  id: number;
  title: ContentBlock;
  description: ContentBlock;
}

@Component({
  selector: 'app-card',
  imports: [NgClass, ImageModalDirective, IconComponent, EditCardButtonComponent],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})

export class CardComponent implements OnChanges {
  readonly card = input.required<QuizCardProps>();
  readonly canEdit = input<boolean>();
  readonly fullScreen = input<boolean>();

  readonly isFlipped = signal(false);
  readonly showClue = signal(false);
  readonly animate = signal(false);
  readonly animationClass = signal('');
  
  public showEditModal: boolean = false;
  private isChanged:  WritableSignal<boolean> = signal(false);

  public clue = computed(() => {
    const text = this.card()?.description?.text;

    if (!text) return '';

    return this.buildClue(text);
  });

  public toggleFlip(skipDuringAutoPlay: boolean = false) {
    if(skipDuringAutoPlay && this.isFlipped()) return

    this.animate.set(true);

    setTimeout(() => this.animate.set(false), 200);

    this.isFlipped.update(v => !v)

    if (this.showClue()) {
      this.showClue.set(!this.showClue())
    }
  }

  public toggleClue(event: Event) {
    event.stopPropagation();
    this.showClue.update(v => !v)
  }

  public speakText(event: Event) {
    event.stopPropagation();

    const card = this.card();
    if (!card) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const text = !this.isFlipped()
      ? card.title?.text
      : card.description?.text;

    if(!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  public triggerSlideInAnimation(dir: 'right' | 'left') {
    this.animationClass.set(
      dir === 'right' 
        ? 'slide-in-right' 
        : 'slide-in-left'
    );

    setTimeout(() => {
      this.animationClass.set('');
    }, 200);
  }

  private buildClue(text: string): string {
    const words = text.trim().split(/\s+/);
    const len = words.length;

    if (len === 1) {
      const w = words[0];
      return w[0] + '.'.repeat(Math.max(0, w.length - 1));
    }

    if (len === 2) {
      return `${words[0]} ${'.'.repeat(Math.max(0, words[1].length - 1))}`;
    }

    const first = words[0];
    const second = words[1];

    if (first.length + second.length >= 15) {
      return `${first} ${'.'.repeat(Math.max(0, second.length - 1))}`;
    }

    const thirdLen = words[2]?.length ?? 1;

    return `${first} ${second} ${'.'.repeat(Math.max(0, thirdLen - 1))}`;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['card']) {
      this.isFlipped.set(false)
      this.showClue.set(false)
      this.isChanged.set(true);

      setTimeout(() => {
        this.isChanged.set(false);
      }, 0)
    }
  }
}
