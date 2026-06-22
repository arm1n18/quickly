import { NgStyle } from '@angular/common';
import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { GameMode } from '../../interfaces/module.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownComponent, DropdownConfig, DropdownItem } from '../../components/ui/dropdown/dropdown.component';
import { CustomButtonComponent, IconComponent } from '../../components/ui';

interface ProgressInterface {
  maxQuestions: number;
  answered: number;
  answeredCorrect: number;
  showAnswers: boolean;
}

interface ConfigInterface {
  title: string;
  onModalClick: () => void;
}

@Component({
  selector: 'app-test-layout',
  imports: [NgStyle, CustomButtonComponent, IconComponent, DropdownComponent],
  templateUrl: './test-layout.html',
  styleUrl: './test-layout.css',
})

export class TestLayout implements OnInit {
  @Input({required: true}) progress: ProgressInterface = {answered: 0, maxQuestions: 0, answeredCorrect: 0, showAnswers: false};
  @Input({required: true}) config: ConfigInterface = {
    title: '',
    onModalClick: () => {}
  };
  private testMode: WritableSignal<Partial<DropdownConfig>> = signal({});
  protected readonly Math = Math;

  public dropdownList: DropdownItem[][] = [
    [
      { title: {text: 'Картки'}, onClick: () => this.changeGameMode('flashcards'), icon : {
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
      } },
      { title: {text: 'Пошук'}, onClick: () => this.changeGameMode('default') }
    ]
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ){}

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

  private getCurrentMode(mode: string): Partial<DropdownConfig>  {
    const currentModeIndex = this.dropdownList[0].findIndex(i => i.title.text == mode);
    this.dropdownList[0][currentModeIndex].preselected = true

    return {
      title: this.dropdownList[0][currentModeIndex]?.title, 
      divider: 'line', 
      icon: {
        name: this.dropdownList[0][currentModeIndex].icon!.name,
        color: this.dropdownList[0][currentModeIndex].icon!.color
      }
    }
  }

  ngOnInit(): void {
    switch (this.route.snapshot.url.map(seg => seg.path)[0]) {
      case "test" : {
        this.getCurrentMode("Тестування")
        break
      }
      case "flashcards" : {
        this.getCurrentMode("Картки")
        break
      }
      case "match" : {
        this.getCurrentMode("Підбір")
        break
      }
    }
  }
}
