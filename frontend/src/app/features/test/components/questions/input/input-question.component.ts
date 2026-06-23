import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass} from '@angular/common';
import { Subject } from 'rxjs';
import { ImageModalDirective } from 'app/core/directives/image/image-modal.directive';
import { ButtonComponent, IconComponent, InputComponent } from 'app/shared/ui';
import { Feedback } from 'app/shared/utils/feedback.utils';
import { TestInputCard } from '../../../models/test-card.interface';

@Component({
  selector: 'app-input-question',
  imports: [
    NgClass,
    ButtonComponent,
    IconComponent,
    InputComponent,
    ImageModalDirective
],
  templateUrl: './input-question.component.html',
  styleUrl: './input-question.component.css'
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
