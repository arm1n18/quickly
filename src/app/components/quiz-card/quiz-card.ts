import {Component, Input, OnChanges, signal, SimpleChanges, WritableSignal} from '@angular/core';
import  { Icon } from '../ui'
import { ChangeDetectorRef } from '@angular/core';
import {NgClass, NgOptimizedImage} from '@angular/common';
import {Card} from '../../interfaces/quizCard.interface';

@Component({
  selector: 'app-quiz-card',
  imports: [Icon, NgClass, NgOptimizedImage],
  templateUrl: './quiz-card.html',
  styleUrl: './quiz-card.css'
})

export class QuizCard implements OnChanges {
  @Input({ required: true }) cardInput: Card = { title: {text: ''}, description: {text: ''} };
  animationClass: WritableSignal<string> = signal('');
  isChanged:  WritableSignal<boolean> = signal(false);
  isFlipped: boolean = false;
  noTransition = false;
  showClue: boolean = false;

  constructor(private cdRef: ChangeDetectorRef) {}

  toggleFlip(skipDuringAutoPlay: boolean = false) {
    if(skipDuringAutoPlay && this.isFlipped) return

    this.isFlipped = !this.isFlipped;

    if (this.showClue) {
      this.showClue = !this.showClue;
    }

    this.cdRef.detectChanges();
  }

  toggleClue(event: Event) {
    event.stopPropagation();
    this.showClue = !this.showClue;
  }

  speakText(event: Event) {
    event.stopPropagation();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(!this.isFlipped ? this.cardInput.title.text : this.cardInput.description.text);
    window.speechSynthesis.speak(utterance);
  }

  triggerSlideInAnimation(action: 'right' | 'left') {
    this.animationClass.set(action === 'right' ? 'slide-in-right' : 'slide-in-left');
    this.noTransition = true;
    setTimeout(() => {
      this.noTransition = false;
    }, 0);
    setTimeout(() => {
      this.animationClass.set('');
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['cardInput']) {
      this.isFlipped=false
      this.showClue=false
      this.isChanged.set(true);

      setTimeout(() => {
        this.isChanged.set(false);
      }, 0)
    }
  }
}
