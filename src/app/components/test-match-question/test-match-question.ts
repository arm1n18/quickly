import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ContentBlock, TestMatchCard} from '../../interfaces/quizCard.interface';
import {NgClass} from '@angular/common';
import { Icon, Image } from '../ui';
import { Feedback } from '../../services/feedback/feedback';

@Component({
  selector: 'app-test-match-question',
  imports: [
    NgClass,
    Icon,
    Image
],
  templateUrl: './test-match-question.html',
  styleUrl: './test-match-question.css'
})
export class TestMatchQuestion implements OnInit {
  constructor(public feedback: Feedback) {}

  @Input({ required: true }) showAnswer: boolean = false;
  @Input() answered: (string | undefined)[] | undefined;
  @Input({ required: true }) questions: {questions: TestMatchCard[], answers: ContentBlock[]} | undefined;
  @Input() answers: (ContentBlock | undefined)[] = []
  @Output() questionChange = new EventEmitter<{index: number, answer: string | undefined}>();
  selectedBlock: number = 0;

  get answerBlocks() {
    return Array.from({ length: this.questions?.questions.length ?? 0 }, (_, i) => ({ id: i }))
  }
  
  isCorrectAnswer(index: number): boolean {
    return this.showAnswer ? this.questions?.questions[index].answer.text === this.answered![index] : false
  }

  getAnswerText(blockId?: number): string {
    if (blockId === undefined) return '';
    const answer = this.answers[blockId];
    if (answer === undefined) {
      return blockId === this.selectedBlock ? 'Оберіть зі списку нижче' : '';
    }
    return answer.text || '';
  }

  isAnswered(answer: ContentBlock): boolean {
    return this.answers.some(a => a === answer);
  }

  toggleAnswerBlock(answer: ContentBlock) {
    if(this.selectedBlock == -1 || this.isAnswered(answer)) return;

    this.answers[this.selectedBlock] = answer;
    this.toggleChooseAnswer(answer.text, this.selectedBlock);
    this.selectedBlock = this.answers.findIndex(a => a === undefined);
  }

  toggleChooseAnswer(newAnswer: string | undefined, index: number) {
    if(this.showAnswer) return

    if (this.answers[index] == newAnswer) {
      this.questionChange.emit({index, answer: undefined});
    } else {
      this.questionChange.emit({index, answer: newAnswer});
    }
  }

  removeAnswer(index: number, event: Event) {
    event.stopPropagation();
    this.answers[index] = undefined;
    this.selectedBlock = index
  }

  get isColumn(): boolean {
    return this.questions?.answers?.some(a => a.text!.length > 164) ?? false;
  }

  ngOnInit() {
    this.answers = new Array(this.questions?.questions.length).fill(undefined);
  }
}
