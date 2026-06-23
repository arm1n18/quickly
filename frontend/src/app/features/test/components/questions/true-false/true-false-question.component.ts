import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {NgClass} from '@angular/common';
import { ButtonComponent, IconComponent } from 'app/shared/ui';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { Feedback } from 'app/shared/utils/feedback.utils';
import { TestTFCard } from '../../../models/test-card.interface';

@Component({
  selector: 'app-true-false-question',
  imports: [
    NgClass,
    IconComponent,
    ButtonComponent,
    ImageModalDirective,
],
  templateUrl: './true-false-question.component.html',
  styleUrl: './true-false-question.component.css'
})
export class TrueFalseQuestionComponent implements OnChanges {
  constructor(public feedback: Feedback) {}
  
  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: boolean | undefined;
  @Input({ required: true }) numeration: { pos: number; from: number } = { pos: 0, from: 0 };
  @Input({ required: true }) question: TestTFCard | undefined;
  @Output() questionChange = new EventEmitter<string | undefined>();
  // selectedAnswer: boolean | undefined = undefined;
  skipped: boolean = false;
  feedbackMessage: string = '';

  // toggleChooseAnswer(newAnswer: boolean) {
  //   if(this.showAnswer) return

  //   if (this.selectedAnswer == newAnswer) {
  //     this.selectedAnswer = undefined;
  //     this.questionChange.emit(undefined)
  //   } else {
  //     this.selectedAnswer = newAnswer;
  //     this.questionChange.emit(this.question!.answer.text);
  //   }
  // }

  // skipQuestion() {
  //   if(this.showAnswer) return

  //   this.skipped = true;
  //   this.selectedAnswer = undefined;
  //   this.questionChange.emit("")
  // }

  toggleChooseAnswer(newAnswer: boolean) {
    if(this.showAnswer) return

    if (this.answered == newAnswer) {
      // this.selectedAnswer = undefined;
      this.questionChange.emit(undefined)
    } else {
      // this.selectedAnswer = newAnswer;
      this.questionChange.emit(String(newAnswer));
    }
  }

  skipQuestion() {
    if(this.showAnswer) return

    this.skipped = true;
    // this.selectedAnswer = undefined;
    this.questionChange.emit("")
  }

  speakText(text: string, event: Event) {
    event.stopPropagation();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  isCorrectAnswer(bool: boolean) {
    return this.showAnswer && this.question?.answer.isCorrect === bool;
  }

  isIncorrectAnswer(bool: boolean) {
    return this.showAnswer && this.answered === bool && this.question?.answer?.isCorrect !== bool;
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['showAnswer'] && this.showAnswer) {
      this.feedbackMessage = this.feedback.getFeedbackMessage(this.isCorrectAnswer(this.answered!));
    }
  }
}
