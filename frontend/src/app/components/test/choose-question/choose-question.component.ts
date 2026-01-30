import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {TestQACard} from '../../../interfaces/module.interface';
import {CustomButtonComponent, IconComponent} from '../../ui';
import {NgClass} from '@angular/common';
import { Feedback } from '../../../services/feedback/feedback';
import { ImageModalDirective } from "../../../directives/imageDirective/image-modal.directive";

@Component({
  selector: 'app-choose-question',
  imports: [
    IconComponent,
    NgClass,
    CustomButtonComponent,
    ImageModalDirective
],
  templateUrl: './choose-question.html',
  styleUrl: './choose-question.css'
})

export class ChooseQuestionComponent implements OnChanges {
  constructor(public feedback: Feedback) {}
  
  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: string | undefined;
  @Input({ required: true }) numeration: { pos: number; from: number } = { pos: 0, from: 0 };
  @Input({ required: true }) question: TestQACard | undefined;
  @Output() questionChange = new EventEmitter<string | undefined>();
  // selectedAnswer: number | undefined;
  skipped: boolean = false;
  feedbackMessage = '';

  // toggleChooseAnswer(newAnswer: number) {
  //   if(this.showAnswer) return

  //   if (this.answered == newAnswer) {
  //     this.selectedAnswer = undefined;
  //     this.questionChange.emit(undefined)
  //   } else {
  //     this.selectedAnswer = newAnswer;
  //     this.questionChange.emit(this.question?.answers[newAnswer].text);
  //   }
  // }

  // skipQuestion() {
  //   if(this.showAnswer) return

  //   this.skipped = true;
  //   this.selectedAnswer = undefined;
  //   this.questionChange.emit("")
  // }

  toggleChooseAnswer(newAnswer: string) {
    if(this.showAnswer) return

    if (this.answered == newAnswer) {
      this.questionChange.emit(undefined)
    } else {
      this.questionChange.emit(newAnswer);
    }
  }

  skipQuestion() {
    if(this.showAnswer) return

    this.skipped = true;
    this.questionChange.emit('')
  }

  get isGrid(): boolean {
    return this.question?.answers?.some(a => a.text!.length > 164) ?? false;
  }

  get correctAnswer(): string {
    const correct = this.question?.answers.find(a => a.isCorrect);
    return correct?.text ?? '';
  }

  get isAnsweredCorrect(): boolean {
    return this.correctAnswer == this.answered;
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

  ngOnChanges(changes: SimpleChanges) {
    if(changes['showAnswer'] && this.showAnswer && this.answered !== undefined) {
      this.feedbackMessage = this.feedback.getFeedbackMessage(this.isAnsweredCorrect);
    }
  }
}
