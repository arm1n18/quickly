import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  QueryList, signal,
  TemplateRef,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, takeUntil, tap, timer} from 'rxjs';
import { ComponentPortal } from '@angular/cdk/portal';
import { ChooseQuestionComponent, InputQuestionComponent, MatchQuestionComponent, TrueFalseQuestionComponent } from 'app/features/test/components';
import { ButtonComponent, DoughnutChartComponent, DropdownComponent, IconComponent, ModalComponent } from 'app/shared/ui';
import { Module } from 'app/features/modules/models/module.interface';
import { GameMode, TestInputCard, TestItem, TestMap, TestMatchCard, TestQACard, TestResult, TestTFCard } from 'app/features/test/models/test-card.interface';
import { DropdownItem } from 'app/shared/ui/dropdown/dropdown.component';
import { CardsState } from 'app/features/modules/state/module.state';
import { PortalService } from 'app/core/services/portal/portal.service';
import { shuffleArray } from 'app/shared/utils/random.utils';
import { Card, ContentBlock } from '../../models/cards.interface';
import { isAnswerMode, isTestMode } from 'app/shared/utils/validate.utils';

export type TestMode = 'true-false' | 'choose' | 'match' | 'input';

interface ShowConfig {
  showModeDropdown: boolean;
  showAnswerMode: boolean;
  showAnswers: boolean;
}

interface TestConfig {
  showImages: boolean;
  max: number;
  mode: TestMode;
  answerMode: 'title' | 'description';
}

@Component({
  selector: 'app-cards-test-page',
  imports: [
    ChooseQuestionComponent,
    TrueFalseQuestionComponent,
    FormsModule,
    NgClass,
    NgStyle,
    DropdownComponent,
    ButtonComponent,
    IconComponent,
    MatchQuestionComponent,
    DoughnutChartComponent,
    InputQuestionComponent
],
  templateUrl: './cards-test.page.html',
  styleUrl: './cards-test.page.css'
})

export class CardsTestPageComponent implements OnInit, OnDestroy {
  private state = inject(CardsState);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private portal = inject(PortalService);

  private stopTimer$ = new Subject<void>();
  private destroy$ = new Subject<void>();
  
  @ViewChild('finishButton', { read: ElementRef })
  public finishButton!: ElementRef;

  @ViewChildren('questionRef', { read: ElementRef })
  public questionElements!: QueryList<ElementRef>;

  private module = signal<Module | null>(null);

  private result = signal<TestResult>({
    answered: 0,
    correct: [], 
    incorrect: [], 
    answers: []
  });

  public answeredCount = computed(() =>
    this.result().answered
  );
  
  public tests = signal<TestMap>({
    choose: [],
    tf: [],
    input: [],
    match: { questions: [], answers: [] },
  });

  public testConfig = signal<TestConfig>({
    showImages: true,
    max: 0,
    mode: 'true-false',
    answerMode: 'description'
  })

  public showConfig = signal<ShowConfig>({
    showModeDropdown: false,
    showAnswerMode: false,
    showAnswers: false,
  });

  public timer = signal({ m: 0, s: 0 });

  public tempConfig = signal<TestConfig>(this.testConfig());

  public dropdownList: DropdownItem[][] = [
    [
      {
        title: { text: 'Картки' },
        icon: { name: 'Slider', color: 'var(--accent)' },
        onClick: () => this.changeGameMode('flashcards'),
      },
      {
        title: { text: 'Підбір' },
        icon: { name: 'Notes', color: 'var(--accent)' },
        onClick: () => this.changeGameMode('match'),
      },
      {
        preselected: true,
        title: { text: 'Тестування' },
        icon: { name: 'Document', color: 'var(--accent)' },
        onClick: () => this.changeGameMode('test'),
      },
    ],
    [
      {
        title: { text: 'Головна' },
        icon: { name: 'House', color: 'var(--accent)' },
        onClick: () => this.changeGameMode('default'),
      },
    ],
  ];

  private setTest<T extends keyof TestMap>(type: T, value: TestMap[T]) {
    this.tests.update((t) => ({ ...t, [type]: value }));
  }  

  private pushTest<T extends Exclude<keyof TestMap, 'match'>>(
    type: T, 
    value: TestItem<TestMap[T]>
  ) {
    this.tests.update(t => ({
      ...t,
      [type]: [...t[type], value]
    }));
  }

  public getTest<T extends keyof TestMap>(type: T): TestMap[T] {
    return this.tests()[type]
  }

  private generateQuestions(): void {
    const module = this.module();
    if (!module) return;

    const config = this.testConfig();

    const shuffled: Card[] = shuffleArray(this.module()!.cards);
    const len = Math.min(shuffled.length, config.max)

    switch (config.mode) {
      case ('choose'): {
        this.generateChoose(shuffled, len);
      }
      break;
      case ('match'): {
        this.generateMatch(shuffled, len);
      }
      break;
      case ('true-false'): {
        this.generateTrueFalse(shuffled, len);
      }
      break;
      case ('input'): {
        this.generateInput(shuffled, len);
      }
    }
  }

  private generateChoose(cards: Card[], len: number) {
    const config = this.testConfig();

    for (let i = 0; i < len; i++) {
      let card = cards[i];
      const others = shuffleArray(cards.filter((_, id) => id !== i)).slice(0, 3);

      const questions: TestQACard = {
        question: config.answerMode == 'title' ? card.description : card.title,
        answers: shuffleArray([
          {
            isCorrect: true,
            ...(config.answerMode == 'title' ? card.title : card.description),
          },
          ...others.map(c => ({
            isCorrect:false, 
            ...(config.answerMode == 'title' ? c.title : c.description)
          }))
        ])
      }


      // questions.answers = shuffleArray(questions.answers);
      this.pushTest('choose', questions)
    }
  }

  private generateMatch(cards: Card[], len: number) {
    const config = this.testConfig();

    const questions: TestMatchCard[] = cards.slice(0, len).map((c, i) => ({
        question: {id: `q${i}`, ...(config.answerMode == 'title' ? c.description : c.title)},
        answer: {id: `q${i}`, ...(config.answerMode == 'title' ? c.title : c.description)}
    }));

    const answers: ContentBlock[] = shuffleArray(
      cards.slice(0, len)
      .flatMap((c, i) => ({
        id: `q${i}`, 
        ...(config.answerMode == 'title' ? c.title : c.description)
      }))
    );

    this.setTest('match', { questions, answers });
  }

  private generateTrueFalse(cards: Card[], len: number) {
    const config = this.testConfig();
    
    for (let i = 0; i < len; i++) {
      const card = cards[i];
      const isCorrect = Math.random() > 0.5;

      const other = cards.filter((_, id) => id !== i);
      const randomCard = other[Math.floor(Math.random() * other.length)];
      const answerCard = isCorrect ? card : randomCard;

      const tf: TestTFCard = {
        question: config.answerMode == 'title'
          ? card.description
          : card.title ,
        answer: {
          isCorrect: false,
          ...(config.answerMode == 'title'
          ? answerCard.title
          : answerCard.description),
        }
      }

      this.pushTest('tf', tf)
    }
  }

  private generateInput(cards: Card[], len: number) {
    const config = this.testConfig();

    const input: TestInputCard[] = cards.slice(0, len).map((c) => ({
      question:
        config.answerMode === 'title' ? c.description : c.title,
      answer:
        config.answerMode === 'title' ? c.title : c.description,
    }));

    this.setTest('input', input)
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
    this.result.set({answered: 0, answers: [], correct: [], incorrect: []});
  }

  public applyTestConfig() {
    this.testConfig.set(this.tempConfig());
    this.resetQuestions();
    this.generateQuestions();
    
    this.result.update(v => {
      return { ...v, answers: [], answered: 0 };
    });

    this.showConfig.update(s => ({
      ...s,
      showAnswers: false
    }));

    let url = new URL(window.location.href);
    let params = url.searchParams;

    params.set('mode', this.tempConfig().mode)
    params.set('max', String(this.tempConfig().max))
    params.set('answerMode', this.tempConfig().answerMode)

    const newUrl = url.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newUrl);

    this.portal.close();
  }

  public resetTestConfig() {
    this.tempConfig.set(this.testConfig())
    this.portal.close()
  }

  public toggleSelectAnswer(index: number, value: string | undefined) {
    this.result.update(r => {
      const answers = [...r.answers];
      let answered = r.answered;

      const prev = answers[index];

      if (value === undefined) {
        if (prev !== undefined) {
          answered--;
        }
        answers[index] = undefined;
      }
      else {
        if (prev === undefined) {
          answered++;
        }
        answers[index] = value;
      }

      return {
        ...r,
        answers,
        answered,
      };
    });

    if (
      this.testConfig().mode === 'true-false' ||
      this.testConfig().mode === 'choose'
    ) {
      this.scrollToNextQuestion(index);
    }
  }

  public scrollToNextQuestion(index: number) {
    const elementsArray = this.questionElements.toArray();

    const nextIndex = this.result().answers.findIndex((a, i) => i > index && a === undefined);
    const nextElement = elementsArray[nextIndex];

    if (nextElement) {
      nextElement.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      if(this.result().answered !== this.testConfig().max) return
      this.finishButton.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  public finishTest() {
    this.stopTimer();

    this.result.update(r => {
      const correct = [...r.correct];
      const incorrect = [...r.incorrect];

      for (let i = 0; i < this.testConfig().max; i++) {
        const mode = this.testConfig().mode;

        let isCorrect = false;

        switch (mode) {
          case 'true-false':
            isCorrect = String(this.getTest('tf')[i].answer.isCorrect) === r.answers[i];
            break;

          case 'choose':
            isCorrect = r.answers[i] === this.getTest('choose')[i].answers.find(a => a.isCorrect)?.text;
            break;

          case 'input':
            isCorrect = r.answers[i] === this.getTest('input')[i].answer.text;
            break;

          case 'match':
            isCorrect = r.answers[i] === this.getTest('match').questions[i].answer.text;
            break;
        }

        if (isCorrect) correct.push(i);
        else incorrect.push(i);
      }

      return {
        ...r,
        correct,
        incorrect,
      };
    });

    window.scrollTo({
      top: 0,
    })

    this.showConfig.update(s => ({
      ...s,
      showAnswers: true
    }));
  }

  public openModal(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Параметри',
        template: template,
        onClose: () => this.resetTestConfig()
      }
    })
  }

  public updateTempConfig<K extends keyof TestConfig>(
    key: K,
    value: TestConfig[K]
  ): void {
    this.tempConfig.update(config => ({
      ...config,
      [key]: value,
    }));
  }

  get getResult(): TestResult {
    return this.result();
  }

  get getModule(): Module | null {
    return this.module();
  }

  ngOnInit(): void {
    this.state.module$
    .pipe(takeUntil(this.destroy$))
      .subscribe(module => {
        if(!module) return

        this.module.set(module);

        this.testConfig.update(current => ({ ...current, max: module.cards.length }));
        this.tempConfig.update(current => ({ ...current, max: module.cards.length }));

        const params = this.route.snapshot.queryParams;
        let max: number = params['max'];
        const answerMode: 'title' | 'description' = params['answerMode'];
        const mode: TestMode = params['mode'];

        const needNavigate =
          max > module.cards.length || max <= 0 ||
          isTestMode(mode) ||
          isAnswerMode(answerMode);

        max = max > 0
          ? Math.min(max, module.cards.length)
          : module.cards.length;

        if (needNavigate) {
          let url = new URL(window.location.href);
          let params = url.searchParams;

          params.set('mode', isTestMode(mode) ? mode : 'choose')
          params.set('max', String(max))
          params.set('answerMode', isAnswerMode(answerMode) ? answerMode : 'title')

          window.history.replaceState({}, '', url.pathname + '?' + params.toString());
        }

        this.testConfig.update(current => ({
          ...current,
          max: max,
          answerMode: isAnswerMode(answerMode) ? answerMode : 'title',
          mode: isTestMode(mode) ? mode : 'choose',
        }));

        this.tempConfig.set({
          ...this.testConfig()
        });
        this.result.update(current => ({ ...current, answers: new Array(this.testConfig().max).fill(undefined) }));

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
