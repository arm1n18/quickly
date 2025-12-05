import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {TestTFCard} from '../../interfaces/quizCard.interface';
import {CustomButton, Icon} from '../ui';
import {NgClass} from '@angular/common';
import { Feedback } from '../../services/feedback/feedback';

@Component({
  selector: 'app-test-tf-question',
  imports: [
    Icon,
    NgClass,
    CustomButton,
  ],
  templateUrl: './test-tf-question.html',
  styleUrl: './test-tf-question.css'
})
export class TestTfQuestion implements OnChanges {
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
    if(changes['showAnswer'] && this.showAnswer && this.answered !== undefined) {
      this.feedbackMessage = this.feedback.getFeedbackMessage(this.isCorrectAnswer(this.answered!));
    }
  }
}
