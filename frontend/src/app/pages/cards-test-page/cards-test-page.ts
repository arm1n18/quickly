import {
  Component,
  ElementRef,
  OnDestroy,
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
  ContentBlock, Module, TestInputCard,
  TestResult,
  TestMap,
  TestItem,
  GameMode
} from '../../interfaces/quizCard.interface';
import {CardsState} from '../../state/cards-state/cards-state';
import {CustomButton, Dropdown, DropdownItem, Icon, Modal} from '../../components/ui';
import {NgClass, NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil, tap, timer} from 'rxjs';
import {Validator} from '../../services/validator/validator';
import { DoughnutChart } from '../../components/ui/doughnut-chart/doughnut-chart/doughnut-chart';
import { shuffleArray } from '../../utils/random';

export type TestMode = 'true-false' | 'choose' | 'match' | 'input';

interface ShowConfigInterface {
  showSettingsModal: boolean;
  showModeDropdown: boolean;
  showAnswerMode: boolean;
  showAnswers: boolean;
}

interface TestConfigInterface {
  showImages: boolean;
  maxQuestions: number;
  mode: TestMode;
  answerMode: 'title' | 'description';
}

@Component({
  selector: 'app-cards-test-page',
  imports: [
    DoughnutChart, TestChooseQuestion, TestTfQuestion, TestMatchQuestion, 
    TestInputQuestion, CustomButton, Icon, Modal, NgClass, FormsModule, 
    NgStyle, Dropdown
  ],
  templateUrl: './cards-test-page.html',
  styleUrl: './cards-test-page.css'
})

export class CardsTestPage implements OnInit, OnDestroy {
  private stopTimer$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  
  @ViewChild('finishButton', { read: ElementRef }) finisButtonElement!: ElementRef;
  @ViewChildren('questionRef', { read: ElementRef })
  public questionElements!: QueryList<ElementRef>;

  public showConfig: ShowConfigInterface = {
    showSettingsModal: false,
    showModeDropdown: false,
    showAnswerMode: false,
    showAnswers: false
  }

  private currentModule: WritableSignal<Module | null> = signal(null);
  private result: TestResult = { answered: 0, correct: [], incorrect: [], answers: [] };
  public tests: WritableSignal<TestMap> = signal({ choose: [], tf: [], input: [], match: { questions: [], answers: [] } });

  public testConfig: WritableSignal<TestConfigInterface> = signal({
    showImages: true,
    maxQuestions: 0,
    mode: 'true-false',
    answerMode: 'description'
  })
  public tempTestConfig = { ...this.testConfig() };

  public timer: WritableSignal<{ m: number, s: number }> = signal({ m: 0, s: 0 });

  public dropdownList: DropdownItem[][] = [
    [
      { title: 'Картки', onClick: () => this.changeGameMode('flashcards'), icon : {
        name: 'Slider',
        color: 'var(--accent)'
      } },
      { title: 'Підбір', onClick: () => this.changeGameMode('match'), icon: {
        name: 'Notes',
        color: 'var(--accent)'
      } },
      { title: 'Тестування', preselected: true, onClick: () => this.changeGameMode('test'), icon: {
        name: 'Document',
        color: 'var(--accent)'
      } }
    ],
    [
      { title: 'Головна', onClick: () => this.changeGameMode('default'), icon: {
        name: 'House',
        color: 'var(--accent)'
      } },
    ]
  ];

  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private validateService: Validator
  ) {}

  private setTest<T extends keyof TestMap>(type: T, test: TestMap[T]) {
    this.tests.update(current => {
      return {
        ...current,
        [type]: test
      };
    });
  }  

  private pushTest<T extends Exclude<keyof TestMap, 'match'>>(type: T, test: TestItem<TestMap[T]>) {
    this.tests.update(current => {
      return {
        ...current,
        [type]: [...current[type], test]
      };
    });
  }

  public getTest<T extends keyof TestMap>(type: T): TestMap[T] {
    return this.tests()[type]
  }

  private generateQuestions(): void {
    if(!this.currentModule()) return

    const shuffledCards: Card[] = shuffleArray(this.currentModule()!.cards);
    const maxLen = Math.min(shuffledCards.length, this.testConfig().maxQuestions)

    switch (this.testConfig().mode) {
      case ('choose'): {
        this.generateChooseQuestions(shuffledCards, maxLen);
      }
      break;
      case ('match'): {
        this.generateMatchQuestions(shuffledCards, maxLen);
      }
      break;
      case ('true-false'): {
        this.generateTrueFalseQuestions(shuffledCards, maxLen);
      }
      break;
      case ('input'): {
        this.generateInputQuestions(shuffledCards, maxLen);
      }
    }
  }

  private generateChooseQuestions(cards: Card[], length: number) {
    for (let i = 0; i < length; i++) {
      let card = cards[i];

      let testQACard: TestQACard = {
        question: this.testConfig().answerMode == 'title' ? card.description : card.title,
        answers: []
      }

      const otherCards = cards.filter((_, id) => id !== i);
      const randomWrongCards = shuffleArray(otherCards).slice(0, 3);

      let answers: TestAnswer[] = shuffleArray([
        {
          isCorrect: true,
          ...(this.testConfig().answerMode == 'title' ? card.title : card.description),
        },
        ...randomWrongCards.map(c => ({isCorrect:false, ...(this.testConfig().answerMode == 'title' ? c.title : c.description),}))
      ])

      testQACard.answers = shuffleArray(answers);
      this.pushTest('choose', testQACard)
    }
  }

  private generateMatchQuestions(cards: Card[], length: number) {
    const questions: TestMatchCard[] = cards.slice(0, length).map((c, index) => ({
        question: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.description : c.title)},
        answer: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)}
    }));

    const answers: ContentBlock[] = shuffleArray(cards.slice(0, length)
      .flatMap((c, index) => ({
        id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)
      }))
    );

    this.setTest('match', {
      questions: questions,
      answers: answers
    })
  }

  private generateTrueFalseQuestions(cards: Card[], length: number) {
    for (let i = 0; i < length; i++) {
      const card = cards[i];

      if(Math.random() <= 0.5) {
        let randomIndex = Math.floor(Math.random() * (this.currentModule()!.cards.length-1))
        while (randomIndex === i) {
          randomIndex = Math.floor(Math.random() * (this.currentModule()!.cards.length-1))
        }

        let testTFCard: TestTFCard = {
          question: this.testConfig().answerMode == 'title' ? card.description : card.title ,
          answer: {
            isCorrect: false,
            ...(this.testConfig().answerMode == 'title' ? cards[randomIndex].title : cards[randomIndex].description),
          }
        }
        this.pushTest('tf', testTFCard)
      } else {
        let testTFCard: TestTFCard = {
          question: this.testConfig().answerMode == 'title' ? card.description : card.title,
          answer: {
            isCorrect: true,
            ...(this.testConfig().answerMode == 'title' ? card.title : card.description),
          }
        }
        this.pushTest('tf', testTFCard)
      }
    }
  }

  private generateInputQuestions(cards: Card[], length: number) {
    let temp: TestInputCard[] = []

    for (let i = 0; i < length; i++) {
      const card = cards[i];
      temp.push({
        question: this.testConfig().answerMode == 'title' ? card.description : card.title,
        answer: this.testConfig().answerMode == 'title' ? card.title : card.description
      })
    }

    this.setTest('input', temp)
  }

  private resetQuestions() {
    this.tests.set({
      tf: [],
      choose: [],
      input: [],
      match: {
        answers: [],
        questions: []
      }
    })
    this.result = {answered: 0, answers: [], correct: [], incorrect: []}
  }

  public applyTestConfig() {
    this.testConfig.update(() => ({...this.tempTestConfig}));
    this.resetQuestions();
    this.generateQuestions();
    this.toggleShowModal();
    this.result.answers = [];
    this.result.answered = 0;
    this.showConfig.showAnswers = false;

    let url = new URL(window.location.href);
    let params = url.searchParams;

    params.set('mode', this.tempTestConfig.mode)
    params.set('maxQuestions', String(this.tempTestConfig.maxQuestions))
    params.set('answerMode', this.tempTestConfig.answerMode)

    const newUrl = url.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);
  }

  public resetTestConfig() {
    this.tempTestConfig = { ...this.testConfig() };
    this.showConfig.showSettingsModal = false
  }

  public finishTest() {
    this.stopTimer();

    for(let i = 0; i < this.testConfig().maxQuestions; i++) {
      switch (this.testConfig().mode) {
        case 'true-false': {
          if(String(this.getTest('tf')[i].answer.isCorrect) === this.result.answers[i]) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'choose': {
          if(this.result.answers[i] === this.getTest('choose')[i].answers.find(a => a.isCorrect)?.text) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'input': {
          if(this.result.answers[i] === this.getTest('input')[i].answer.text) {
            this.result.correct.push(i)
          } else {
            this.result.incorrect.push(i)
          }
          break;
        }
        case 'match': {
          if(this.result.answers[i] === this.getTest('match').questions[i].answer.text) {
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

    this.showConfig.showAnswers = true
  }

  public toggleSelectAnswer(index: number, value: string | undefined) {
    if(value === undefined) {
      this.result.answered -= 1
      this.result.answers[index] = undefined
    } else {
      if(this.result.answers[index] === undefined) this.result.answered += 1
      this.result.answers[index] = value

      
      if(this.testConfig().mode == 'true-false' || this.testConfig().mode == 'choose') {
       this.scrollToNextQuestion(index)
      }
    }
  }

  public scrollToNextQuestion(index: number) {
    const elementsArray = this.questionElements.toArray();

    const nextIndex = this.result.answers.findIndex((a, i) => i > index && a === undefined);
    const nextElement = elementsArray[nextIndex];

    if (nextElement) {
      nextElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      if(this.result.answered !== this.testConfig().maxQuestions) return
      this.finisButtonElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  public toggleShowModal() {
    this.showConfig.showSettingsModal = !this.showConfig.showSettingsModal
  }

  private startTimer(): void {
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

  private stopTimer(): void {
    this.stopTimer$.next();
  }

  public changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      default:
        void this.router.navigate([`../${mode}`], { relativeTo: this.route });
        break;
    }
  }

  get getResult(): TestResult {
    return this.result;
  }

  get getModule(): Module | null {
    return this.currentModule();
  }

  ngOnInit(): void {
    this.cardsState.module$
    .pipe(takeUntil(this.destroy$))
      .subscribe(module => {
        if(!module) return

        this.currentModule.set(module);

        this.testConfig.update(current => ({ ...current, maxQuestions: module.cards.length }));
        this.tempTestConfig.maxQuestions = module.cards.length

        const params = this.route.snapshot.queryParams;
        let maxQuestions: number = params['maxQuestions'];
        const answerMode: 'title' | 'description' = params['answerMode'];
        const mode: TestMode = params['mode'];

        const needNavigate =
          maxQuestions > module.cards.length || maxQuestions <= 0 ||
          !this.validateService.isTestMode(mode) ||
          !this.validateService.isAnswerMode(answerMode);

        maxQuestions = maxQuestions > 0
          ? Math.min(maxQuestions, module.cards.length)
          : module.cards.length;

        if (needNavigate) {
          let url = new URL(window.location.href);
          let params = url.searchParams;

          params.set('mode', this.validateService.isTestMode(mode) ? mode : 'choose')
          params.set('maxQuestions', String(maxQuestions))
          params.set('answerMode', this.validateService.isAnswerMode(answerMode) ? answerMode : 'title')

          window.history.replaceState({}, '', url.pathname + '?' + params.toString());
        }

        this.testConfig.update(current => ({
          ...current,
          maxQuestions: maxQuestions,
          answerMode: this.validateService.isAnswerMode(answerMode) ? answerMode : 'title',
          mode: this.validateService.isTestMode(mode) ? mode : 'choose',
        }));

        this.tempTestConfig = { ...this.testConfig() };
        this.result.answers = new Array(this.testConfig().maxQuestions).fill(undefined);

        this.generateQuestions();
        this.startTimer();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete()
  }

  protected readonly Math = Math;
}
