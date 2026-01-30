import { Component, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { GameMode, Module } from '../../interfaces/quizCard.interface';
import { CardsState } from '../../state/cards-state/cards-state';
import { Dropdown, CustomButton, Icon, DropdownItem, ModalComponent } from "../../components/ui";
import { NgClass, NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizCards } from "../../components/quiz-cards/quiz-cards";
import { Portal } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-flashcards-page',
  imports: [Dropdown, CustomButton, Icon, NgStyle, QuizCards, NgClass],
  templateUrl: './flashcards-page.html',
  styleUrl: './flashcards-page.css',
})

export class FlashcardsPage {
  @ViewChild(QuizCards) quizCards!: QuizCards;
  @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  
  private currentModule: WritableSignal<Module | null> = signal(null);
  public currentCardIndex: WritableSignal<number> = signal(0);
  public show: {showSettingsModal: boolean, shortcut: boolean} = {
    showSettingsModal: false,
    shortcut: false
  }

  public config: {frontSide: 'title' | 'description', dualCard: boolean} = {
    frontSide: 'title',
    dualCard: false
  }

  public dropdownList: DropdownItem[][] = [
    [ 
      { title: {text: 'Картки'}, preselected: true, onClick: () => this.changeGameMode('flashcards'), icon : {
        name: 'Slider',
        color: 'var(--accent)'
      } },
      { title: {text: 'Підбір'}, onClick: () => this.changeGameMode('match'), icon: {
        name: 'Notes',
        color: 'var(--accent)'
      } },
      { title: {text: 'Тестування'}, onClick: () => this.changeGameMode('test'), icon: {
          name: 'Document',
          color: 'var(--accent)'
      } }
    ],
      [
        { title: {text: 'Головна'}, onClick: () => this.changeGameMode('default'), icon: {
        name: 'House',
        color: 'var(--accent)'
      } }
    ]
  ]

  public dropdownList2: DropdownItem[][] = [
    [
      { title: {text: 'Термін'}, onClick: () => this.config.frontSide = 'title', preselected: this.config.frontSide === 'title' },
      { title: {text: 'Визначення'}, onClick: () => this.config.frontSide = 'description', preselected: this.config.frontSide === 'description' }
    ]
  ]
  
  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private portal: Portal
  ) {}

  public openModal() {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Параметри',
        template: this.modalTemplate,
      }
    })
  }
  
  public changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      case 'test':
        void this.router.navigate(['../test'], { relativeTo: this.route });
        break;
      case 'match':
        void this.router.navigate(['../match'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }

  get getModule(): Module | null {
    return this.currentModule();
  }
    
  ngOnInit(): void {
    this.cardsState.module$.subscribe(module => {
      if(!module) return

      this.currentModule.set(module);
    });
  }
}
