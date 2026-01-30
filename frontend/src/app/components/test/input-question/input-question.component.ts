import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TestInputCard} from '../../../interfaces/module.interface';
import { CustomButtonComponent, CustomInputComponent, IconComponent } from '../../ui';
import {NgClass} from '@angular/common';
import { Subject } from 'rxjs';
import { Feedback } from '../../../services/feedback/feedback';
import { ImageModalDirective } from "../../../directives/imageDirective/image-modal.directive";

@Component({
  selector: 'app-test-input-question',
  imports: [
    CustomButtonComponent,
    IconComponent,
    NgClass,
    CustomInputComponent,
    ImageModalDirective
],
  templateUrl: './input-question.html',
  styleUrl: './input-question.css'
})
export class InputQuestionComponent {
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
