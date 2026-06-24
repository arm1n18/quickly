import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {NgClass} from '@angular/common';
import { ButtonComponent, IconComponent } from 'app/shared/ui';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { Feedback } from 'app/shared/utils/feedback.utils';
import { TestQACard } from '../../../models/test-card.interface';

@Component({
  selector: 'app-choose-question',
  imports: [
    NgClass,
    IconComponent,
    ButtonComponent,
    ImageModalDirective
],
  templateUrl: './choose-question.component.html',
  styleUrl: './choose-question.component.css'
})

export class ChooseQuestionComponent implements OnChanges {
  constructor(public feedback: Feedback) {}
  
  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: string | undefined;
  @Input({ required: true }) numeration: { pos: number; from: number } = { pos: 0, from: 0 };
  @Input({ required: true }) question: TestQACard | undefined;
  @Output() questionChange = new EventEmitter<string | undefined>();
  public skipped: boolean = false;
  public feedbackMessage = '';

  public toggleChooseAnswer(newAnswer: string) {
    if(this.showAnswer) return

    if (this.answered == newAnswer) {
      this.questionChange.emit(undefined)
    } else {
      this.questionChange.emit(newAnswer);
    }
  }

  public skipQuestion() {
    if(this.showAnswer) return

    this.skipped = true;
    this.questionChange.emit('')
  }

  public speakText(text: string, event: Event) {
    event.stopPropagation();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

   get isGrid(): boolean {
    return !this.question?.answers?.some(a => a.text!.length > 164);
  }

  get correctAnswer(): string {
    const correct = this.question?.answers.find(a => a.isCorrect);
    return correct?.text ?? '';
  }

  get isCorrectAnswer(): boolean {
    return this.correctAnswer == this.answered;
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['showAnswer'] && this.showAnswer) {
      this.feedbackMessage = this.feedback.getFeedbackMessage(this.isCorrectAnswer);
    }
  }
}
