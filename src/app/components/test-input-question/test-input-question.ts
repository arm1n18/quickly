import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TestInputCard} from '../../interfaces/quizCard.interface';
import { CustomButton, Icon, Image } from '../ui';
import {NgClass} from '@angular/common';
import { Subject } from 'rxjs';
import { Feedback } from '../../services/feedback/feedback';
import { CustomInput } from "../ui/custom-input/custom-input";

@Component({
  selector: 'app-test-input-question',
  imports: [
    CustomButton,
    Icon,
    NgClass,
    Image,
    CustomInput
],
  templateUrl: './test-input-question.html',
  styleUrl: './test-input-question.css'
})
export class TestInputQuestion {
  constructor(public feedback: Feedback) {}
  
  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: string | undefined;
  @Input({ required: true }) numeration: { pos: number; from: number } = { pos: 0, from: 0 };
  @Input({ required: true }) question: TestInputCard | undefined;
  @Output() questionChange = new EventEmitter<string | undefined>();
  @Output() nextQuestion = new EventEmitter();
  input$ = new Subject<string>();

  speakText(text: string, event: Event) {
    event.stopPropagation();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  onInputChange(value: any) {
    this.questionChange.emit(value);
  }

  nextQuestionClick() {
    this.nextQuestion.emit()
  }

  get isCorrectAnswer(): boolean {
    return this.question?.answer.text == this.answered;
  }
}
