import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ContentBlock, TestMatchCard} from '../../../interfaces/module.interface';
import {NgClass} from '@angular/common';
import { IconComponent } from '../../ui';
import { Feedback } from '../../../services/feedback/feedback';
import { ImageModalDirective } from"../../../directives/imageDirective/image-modal.directive";

@Component({
  selector: 'app-match-question',
  imports: [
    NgClass,
    IconComponent,
    ImageModalDirective
],
  templateUrl: './match-question.html',
  styleUrl: './match-question.css'
})

export class MatchQuestionComponent implements OnInit, OnChanges {
  constructor(public feedback: Feedback) {}

  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: (string | undefined)[] | undefined;
  @Input({ required: true }) questions: {questions: TestMatchCard[], answers: ContentBlock[]} | undefined;
  @Input() answers: (ContentBlock | undefined)[] = []
  @Output() questionChange = new EventEmitter<{index: number, answer: string | undefined}>();
  public selectedBlock: number = 0;
  public feedbackMessage: string[] = [];

  get answerBlocks() {
    return Array.from({ length: this.questions?.questions.length ?? 0 }, (_, i) => ({ id: i }))
  }

  get isColumn(): boolean {
    return this.questions?.answers?.some(a => a.text!.length > 164) ?? false;
  }
  
  public isCorrectAnswer(index: number): boolean {
    return this.showAnswer ? this.questions?.questions[index].answer.text === this.answered![index] : false
  }

 public  getAnswerText(blockId?: number): string {
    if (blockId === undefined) return '';
    const answer = this.answers[blockId];
    if (answer === undefined) {
      return blockId === this.selectedBlock ? 'Оберіть зі списку нижче' : '';
    }
    return answer.text || '';
  }

  public isAnswered(answer: ContentBlock): boolean {
    return this.answers.some(a => a === answer);
  }

  public toggleAnswerBlock(answer: ContentBlock) {
    if(this.selectedBlock == -1 || this.isAnswered(answer)) return;
    
    this.answers[this.selectedBlock] = answer;
    this.toggleChooseAnswer(answer.text, this.selectedBlock);
    this.selectedBlock = this.answers.findIndex(a => a === undefined);
  }

  public toggleChooseAnswer(newAnswer: string | undefined, index: number) {
    if(this.showAnswer) return
    if (this.answers[index] == newAnswer) {
      this.questionChange.emit({index, answer: undefined});
    } else {
      this.questionChange.emit({index, answer: newAnswer});
    }
  }

  public removeAnswer(index: number, event: Event) {
    event.stopPropagation();
    
    this.answers[index] = undefined;
    this.toggleChooseAnswer(undefined, index)
    this.selectedBlock = index
  }

  public updateFeedbackMessages() {
    this.feedbackMessage = this.questions?.questions?.map((q, i) =>
      this.feedback.getFeedbackMessage(this.isCorrectAnswer(i))
    ) || [];
  }

  ngOnInit() {
    this.answers = new Array(this.questions?.questions.length).fill(undefined);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showAnswer'] && this.showAnswer) {
      this.updateFeedbackMessages()
    }
  }
}
