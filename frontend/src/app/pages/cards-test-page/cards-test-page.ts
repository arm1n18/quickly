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
  TestResult,
  TestMap,
  MatchCard,
  TestItem
} from '../../interfaces/quizCard.interface';
import {CardsState} from '../../state/cards-state/cards-state';
import {CustomButton, Dropdown, DropdownItem, Icon, Modal} from '../../components/ui';
import {NgClass, NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, Subject, takeUntil, tap, timer} from 'rxjs';
import {Validator} from '../../services/validator/validator';
import { DoughnutChart } from '../../components/ui/doughnut-chart/doughnut-chart/doughnut-chart';
import { shuffleArray } from '../../utils/random';

type TestMode = 'true-false' | 'choose' | 'matching' | 'input'
interface ShowConfigInterface {
  showSettingsModal: boolean;
  showModeDropdown: boolean;
  showAnswerMode: boolean;
  showAnswers: boolean;
}

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
  public questionElements!: QueryList<ElementRef>;

  public showConfig: ShowConfigInterface = {
    showSettingsModal: false,
    showModeDropdown: false,
    showAnswerMode: false,
    showAnswers: false
  }

  public result: TestResult = {
    answered: 0,
    correct: [],
    incorrect: [],
    answers: []
  };

  private tests: TestMap = {
    qa: [],
    tf: [],
    input: [],
    match: {
      questions: [],
      answers: []
    }
  }

  public timer: WritableSignal<{ m: number, s: number }> = signal({ m: 0, s: 0 });

  public module: Module= {title: '', cards: []};
  public testConfig: WritableSignal<{
    showImages: boolean;
    maxQuestions: number,
    mode: TestMode,
    answerMode: 'title' | 'description' }> = signal({
    showImages: true,
    maxQuestions: this.module.cards.length,
    mode: 'true-false',
    answerMode: 'description'
  })
  public tempTestConfig = { ...this.testConfig() };

  public dropdownList: DropdownItem[][] = [
    [
      { title: 'Картки', onClick: () => this.changeGameMode('flashcards'), icon : {
        name: 'Slider',
        color: 'var(--accent)'
      } },
      { title: 'Підбір', onClick: () => this.changeGameMode('match'), icon: {
        name: 'Notes',
        color: 'var(--accent)'
      } }],
    [
      { title: 'Головна', onClick: () => this.changeGameMode('default'), icon: {
        name: 'House',
        color: 'var(--accent)'
      } },
      { title: 'Пошук', onClick: () => this.changeGameMode('default') }
    ]
  ]

  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private validateService: Validator
  ) {}

  private setTest<T extends keyof TestMap>(type: T, test: TestMap[T]) {
    this.tests[type] = test
  }  

  private pushTest<T extends Exclude<keyof TestMap, 'match'>>(type: T, test: TestItem<TestMap[T]>) {
    (this.tests[type] as TestItem<TestMap[T]>[]).push(test)
  }  

  public getTest<T extends keyof TestMap>(type: T): TestMap[T] {
    return this.tests[type]
  }

  private generateQuestions(): void {
    const shuffledCards: Card[] = shuffleArray(this.module.cards);
    const maxLen = Math.min(shuffledCards.length, this.testConfig().maxQuestions)

    switch (this.testConfig().mode) {
      case ('choose'): {
        for (let i = 0; i < maxLen; i++) {
          let shuffledCard = shuffledCards[i];

          let testQACard: TestQACard = {
            question: this.testConfig().answerMode == 'title' ? shuffledCard.description : shuffledCard.title,
            answers: []
          }

          const otherCards = shuffledCards.filter((_, id) => id !== i);
          const randomWrongCards = shuffleArray(otherCards).slice(0, 3);

          let answers: TestAnswer[] = shuffleArray([
            {
              isCorrect: true,
              ...(this.testConfig().answerMode == 'title' ? shuffledCard.title : shuffledCard.description),
            },
            ...randomWrongCards.map(c => ({isCorrect:false, ...(this.testConfig().answerMode == 'title' ? c.title : c.description),}))
          ])

          testQACard.answers = shuffleArray(answers);
          this.pushTest('qa', testQACard)
        }
      }
      break;
      case ('matching'): {
        const questions: TestMatchCard[] = shuffledCards.slice(0, maxLen).map((c, index) => ({
            question: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.description : c.title)},
            answer: {id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)}
        }));

        const answers: ContentBlock[] = shuffleArray(shuffledCards.slice(0, maxLen)
          .flatMap((c, index) => ({
            id: `q${index}`, ...(this.testConfig().answerMode == 'title' ? c.title : c.description)
          }))
        );

        this.setTest('match', {
          questions: questions,
          answers: answers
        })
      }
      break;
      case ('true-false'): {
        for (let i = 0; i < maxLen; i++) {
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
            this.pushTest('tf', testTFCard)
          } else {
            let testTFCard: TestTFCard = {
              question: this.testConfig().answerMode == 'title' ? shuffledCard.description : shuffledCard.title,
              answer: {
                isCorrect: true,
                ...(this.testConfig().answerMode == 'title' ? shuffledCard.title : shuffledCard.description),
              }
            }
            this.pushTest('tf', testTFCard)
          }
        }
      }
      break;
      case ('input'): {
        let temp: TestInputCard[] = []

        for (let i = 0; i < maxLen; i++) {
          const card = shuffledCards[i];
          temp.push({
            question: this.testConfig().answerMode == 'title' ? card.description : card.title,
            answer: this.testConfig().answerMode == 'title' ? card.title : card.description
          })
        }

        this.setTest('input', temp)
      }
    }
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
          if(this.result.answers[i] === this.getTest('qa')[i].answers.find(a => a.isCorrect)?.text) {
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
        case 'matching': {
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

  public toggleShowModal() {
    this.showConfig.showSettingsModal = !this.showConfig.showSettingsModal
  }

  private resetQuestions() {
    this.tests = {
      tf: [],
      qa: [],
      input: [],
      match: {
        answers: [],
        questions: []
      }
    }
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
