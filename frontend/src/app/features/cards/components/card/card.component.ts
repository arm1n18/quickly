import {Component, Input, OnChanges, signal, SimpleChanges, WritableSignal} from '@angular/core';
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
  @Input() canEdit: boolean = false;
  @Input({ required: true }) cardInput: QuizCardProps | undefined = undefined;
  @Input() fullScreen: boolean = false;
  @Input() dualCard: boolean = false;

  public showEditModal: boolean = false;

  public animationClass: WritableSignal<string> = signal('');
  public animate: WritableSignal<boolean> = signal(false);
  private isChanged:  WritableSignal<boolean> = signal(false);

  public isFlipped: WritableSignal<boolean> = signal(false);
  public showClue: WritableSignal<boolean> = signal(false);

  public toggleFlip(skipDuringAutoPlay: boolean = false) {
    if(skipDuringAutoPlay && this.isFlipped()) return

    this.animate.set(true);
    setTimeout(() => {
      this.animate.set(false);
    }, 200);

    this.isFlipped.set(!this.isFlipped())

    if (this.showClue()) {
      this.showClue.set(!this.showClue())
    }
  }

  public toggleClue(event: Event) {
    event.stopPropagation();
    this.showClue.set(!this.showClue())
  }

  public speakText(event: Event) {
    if (this.cardInput) {
      event.stopPropagation();

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(!this.isFlipped ? this.cardInput.title.text : this.cardInput.description.text);
      window.speechSynthesis.speak(utterance);
    }
  }

  public triggerSlideInAnimation(action: 'right' | 'left') {
    this.animationClass.set(action === 'right' ? 'slide-in-right' : 'slide-in-left');
    setTimeout(() => {
      this.animationClass.set('');
    }, 200);
  }

  get getClue(): string {
    if(this.cardInput && this.cardInput.description.text) {
      const mA = this.cardInput.description.text.split(" ")

      const len = mA.length;

      if (len > 2) {
        if((mA[0].length + mA[1].length) >= 15) {
          return `${mA[0]} ${'.'.repeat(mA[1].length-1)}`
        } else {
          return`${mA[0]} ${mA[1]} ${'.'.repeat(mA[2].length-1)}`
        }
      } else if (len === 2) {
        return `${mA[0]} ${'.'.repeat(mA[1].length-1)}`
      } else if (len === 1) {
        return `${mA[0][0]}${'.'.repeat(mA[0].length-1)}`
      }
    }

    return ""
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cardInput']) {
      this.isFlipped.set(false)
      this.showClue.set(false)
      this.isChanged.set(true);

      setTimeout(() => {
        this.isChanged.set(false);
      }, 0)
    }
  }
}
