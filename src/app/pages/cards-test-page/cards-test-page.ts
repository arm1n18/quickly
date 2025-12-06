import {
  Component,
  ElementRef,
  OnInit,
  QueryList, signal,
  ViewChild,
  ViewChildren, WritableSignal
} from '@angular/core';
import {TestChooseQuestion, TestMatchQuestion, TestInputQuestion, TestTfQuestion} from '../../components'
import {
  TestAnswer,
  Card,
  TestQACard,
  TestTFCard,
  TestMatchCard,
  ContentBlock, Module, TestInputCard, GameMode,
  TestResult
} from '../../interfaces/quizCard.interface';
import {CardsState} from '../../state/cards-state/cards-state';
import {CustomButton, Dropdown, DropdownItem, Icon, Modal} from '../../components/ui';
import {NgClass, NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, Subject, takeUntil, tap, timer} from 'rxjs';
import {Validator} from '../../services/validator/validator';
import { DoughnutChart } from '../../components/ui/doughnut-chart/doughnut-chart/doughnut-chart';

type TestMode = 'true-false' | 'choose' | 'matching' | 'input'

@Component({
  selector: 'app-cards-test-page',
  imports: [DoughnutChart, TestChooseQuestion, TestTfQuestion, TestMatchQuestion, TestInputQuestion, CustomButton, Icon, NgStyle, Modal, NgClass, FormsModule, Dropdown],
  templateUrl: './cards-test-page.html',
  styleUrl: './cards-test-page.css'
})
export class CardsTestPage implements OnInit {
  private stopTimer$ = new Subject<void>();

  @ViewChild('finishButton', { read: ElementRef }) finisButtonElement!: ElementRef;
  @ViewChildren('questionRef', { read: ElementRef })
  questionElements!: QueryList<ElementRef>;

  show: {showSettingsModal: boolean, showModeDropdown: boolean, showAnswerMode: boolean, showAnswers: boolean} = {
    showSettingsModal: false,
    showModeDropdown: false,
    showAnswerMode: false,
    showAnswers: false
  }

  answered: number = 0;
  result: TestResult = {
    correct: [],
    incorrect: [],
    answers: []
  };

  testQA: TestQACard[] = []
  testTF: TestTFCard[] = []
  testInput: TestInputCard[] = []
  testMatch: {questions: TestMatchCard[], answers: ContentBlock[]} = { questions: [], answers: [] }
  timer: WritableSignal<{ m: number, s: number }> = signal({ m: 0, s: 0 });

  module: Module= {title: '', cards: []};
  testConfig: WritableSignal<{
    showImages: boolean;
    maxQuestions: number,
    mode: TestMode,
    answerMode: 'title' | 'description' }> = signal({
    showImages: true,
    maxQuestions: this.module.cards.length,
    mode: 'true-false',
    answerMode: 'description'
  })
  tempTestConfig = { ...this.testConfig() };

  dropdownList: DropdownItem[][] = [
    [
      { title: 'Картки', onClick: () => this.changeGameMode('flashcards') },
      { title: 'Підбір', onClick: () => this.changeGameMode('match') }],
    [
      { title: 'Головна', onClick: () => this.changeGameMode('default') },
      { title: 'Пошук', onClick: () => this.changeGameMode('default') }
    ]
  ]

  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private validateService: Validator
  ) {}

  generateQuestions(): void {
    const shuffledCards: Card[] = this.shuffleArray(this.module.cards);
    const maxLength = Math.min(shuffledCards.length, this.testConfig().maxQuestions)

    switch (this.testConfig().mode) {
      case ('choose'): {
        for (let i = 0; i < maxLength; i++) {
          let shuffledCard = shuffledCards[i];

          let testQACard: TestQACard = {
            question: this.testConfig().answerMode == 'title' ? shuffledCard.description : shuffledCard.title,
            answers: []
          }

          const otherCards = shuffledCards.filter((_, id) => id !== i);
          const randomWrongCards = this.shuffleArray(otherCards).slice(0, 4);

          let answers: TestAnswer[] = this.shuffleArray([
            {
              isCorrect: true,
              ...(this.testConfig().answerMode == 'title' ? shuffledCard.title : shuffledCard.description),
            },
            ...randomWrongCards.map(c => ({isCorrect:false, ...(this.testConfig().answerMode == 'title' ? c.title : c.description),}))
          ])

          testQACard.answers = this.shuffleArray(answers);
          this.testQA.push(testQACard);
        }
      }
      break;
      case ('matching'): {
        const questions: TestMatchCard[] = shuffledCards.slice(0, maxLength).map((c, index) => ({
            question: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.description : c.title)},
            answer: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)}
        }));
        const answers: ContentBlock[] = this.shuffleArray(shuffledCards.slice(0, maxLength)
          .flatMap((c, index) => ({
            id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)
          }))
        );

        this.testMatch.questions = questions;
        this.testMatch.answers = answers;
      }
      break;
      case ('true-false'): {
        for (let i = 0; i < maxLength; i++) {
          let shuffledCard = shuffledCards[i];
          if(Math.random() <= 0.5) {
            let randomIndex = Math.floor(Math.random() * (this.module.cards.length-1))
            while (randomIndex === i) {
              randomIndex = Math.floor(Math.random() * (this.module.cards.length-1))
            }

            let testTFCard: TestTFCard = {
              question: this.testConfig().answerMode == 'title' ? shuffledCard.description : shuffledCard.title ,
              answer: {
                isCorrect: false,
                ...(this.testConfig().answerMode == 'title' ? shuffledCards[randomIndex].title : shuffledCards[randomIndex].description),
              }
            }
            this.testTF.push(testTFCard);
          } else {
            let testTFCard: TestTFCard = {
              question: this.testConfig().answerMode == 'title' ? shuffledCard.description : shuffledCard.title,
              answer: {
                isCorrect: true,
                ...(this.testConfig().answerMode == 'title' ? shuffledCard.title : shuffledCard.description),
              }
            }
            this.testTF.push(testTFCard);
          }
        }

        console.log(this.testTF);
      }
      break;
      case ('input'): {
        for (let i = 0; i < maxLength; i++) {
          const card = shuffledCards[i];
          this.testInput.push({
            question: this.testConfig().answerMode == 'title' ? card.description : card.title,
            answer: this.testConfig().answerMode == 'title' ? card.title : card.description
          })
        }
      }
    }
  }

  shuffleArray<T>(array: T[]): T[] {
    const newArray: T[] = [...array];

    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }

    return newArray;
  }

  toggleSelectAnswer(index: number, value: string | undefined) {
    if(value === undefined) {
      this.answered -= 1
      this.result.answers[index] = undefined
    } else {
      if(this.result.answers[index] === undefined) this.answered += 1
      this.result.answers[index] = value

      
      if(this.testConfig().mode == 'true-false' || this.testConfig().mode == 'choose') {
       this.scrollToNextQuestion(index)
      }
    }
  }

  scrollToNextQuestion(index: number) {
    const elementsArray = this.questionElements.toArray();

    const nextIndex = this.result.answers.findIndex((a, i) => i > index && a === undefined);
    const nextElement = elementsArray[nextIndex];

    if (nextElement) {
      nextElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      if(this.answered !== this.testConfig().maxQuestions) return
      this.finisButtonElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  finishTest() {
    this.stopTimer();

    for(let i = 0; i < this.testConfig().maxQuestions; i++) {
      switch (this.testConfig().mode) {
        case 'true-false': {
          if(String(this.testTF[i].answer.isCorrect) === this.result.answers[i]) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'choose': {
          if(this.result.answers[i] === this.testQA[i].answers.find(a => a.isCorrect)?.text) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'input': {
          if(this.result.answers[i] === this.testInput[i].answer.text) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'matching': {
          if(this.result.answers[i] === this.testMatch.questions[i].answer.text) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
      }
    }

    window.scrollTo({
      top: 0,
    })

    this.show.showAnswers = true
  }

  toggleShowModal() {
    this.show.showSettingsModal = !this.show.showSettingsModal
  }

  resetQuestions() {
    this.testQA = [];
    this.testInput = [];
    this.testMatch = { questions: [], answers: [] };
    this.testTF = [];
    this.result = {answers: [], correct: [], incorrect: []}
  }

  applyTestConfig() {
    this.testConfig.update(() => ({...this.tempTestConfig}));
    this.resetQuestions();
    this.generateQuestions();
    this.toggleShowModal();
    this.result.answers = [];
    this.answered = 0;
    this.show.showAnswers = false;

    let url = new URL(window.location.href);
    let params = url.searchParams;

    params.set('mode', this.tempTestConfig.mode)
    params.set('maxQuestions', String(this.tempTestConfig.maxQuestions))
    params.set('answerMode', this.tempTestConfig.answerMode)

    const newUrl = url.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
  }

  resetTestConfig() {
    this.tempTestConfig = { ...this.testConfig() };
    this.show.showSettingsModal = false
  }

  changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      case 'match':
        void this.router.navigate(['../match'], { relativeTo: this.route });
        break;
      case 'flashcards':
        void this.router.navigate(['../flashcards'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }

  startTimer(): void {
    const start = performance.now();

    timer(0,1000).pipe(
      takeUntil(this.stopTimer$),
      tap(() => {
        const elapsed = performance.now() - start;

        const totalMs = Math.floor(elapsed);

        const m = Math.floor(totalMs / 60000);
        const s = Math.floor((totalMs % 60000) / 1000);

        this.timer.set({ m, s });
      })
    ).subscribe();
  }

  stopTimer(): void {
    this.stopTimer$.next();
  }

  ngOnInit(): void {
    combineLatest([this.cardsState.module$, this.route.queryParams]).subscribe(([module, params]) => {
      if(!module) return

      this.module = module;
      this.testConfig.update(current => ({
        ...current,
        maxQuestions: this.module.cards.length
      }));
      this.tempTestConfig.maxQuestions = this.module.cards.length

      const maxQuestions: number = params['maxQuestions'];
      const answerMode: 'title' | 'description' = params['answerMode'];
      const mode: TestMode = params['mode'];

      const needNavigate =
        maxQuestions > this.module.cards.length || maxQuestions <= 0 ||
        !this.validateService.isTestMode(mode) ||
        !this.validateService.isAnswerMode(answerMode);

      const maxQ = maxQuestions > 0
        ? Math.min(maxQuestions, this.module.cards.length)
        : this.module.cards.length;

      if (needNavigate) {
        let url = new URL(window.location.href);
        let params = url.searchParams;

        params.set('mode', this.validateService.isTestMode(mode) ? mode : 'choose')
        params.set('maxQuestions', String(maxQ))
        params.set('answerMode', this.validateService.isAnswerMode(answerMode) ? answerMode : 'title')

        const newUrl = url.pathname + '?' + params.toString();
        window.history.replaceState({}, '', newUrl);
      }

      this.testConfig.update(current => ({
        ...current,
        maxQuestions: maxQ,
        answerMode: this.validateService.isAnswerMode(answerMode) ? answerMode : 'title',
        mode: this.validateService.isTestMode(mode) ? mode : 'choose',
      }));

      this.tempTestConfig = {
        ...this.testConfig()
      };

      this.result.answers = new Array(this.testConfig().maxQuestions).fill(undefined);

      this.generateQuestions();
      this.startTimer();
    });
  }

  protected readonly Math = Math;
}
