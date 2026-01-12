import { Component } from '@angular/core';
import { AnswerOption, MissingWordData, MissingWordPlaceholder, MissingWordSentence } from '../../interfaces/selectMissingWords.interface';
import { NgClass } from '@angular/common';
import { shuffleArray } from '../../utils/random';
import { Icon, CustomButton, Dropdown, DropdownItem } from "../../components/ui";

type Mode = 'dropdown' | 'input'

@Component({
  selector: 'app-select-missing-words-page',
  imports: [NgClass, Icon, CustomButton, Dropdown],
  templateUrl: './select-missing-words-page.html',
  styleUrl: './select-missing-words-page.css',
})

export class SelectMissingWordsPage {
  public config: {type: Mode} = {
    type: 'input',
  }

  public answers: Record<string, AnswerOption | undefined> = {};
  public options: AnswerOption[] = [];
  public selectedBlock: string = '';

  missingWordsData: MissingWordData = {
    sentences: [
        {
            sentence: "1. I {{w1}} an {{w2}} today.",
            placeholders: [
                { id: 'w1', options: ['ate', 'eat', 'eaten'], correctOptionIndex: 0 },
                { id: 'w2', options: ['apple', 'banana'], correctOptionIndex: 0 },
            ]
        },
        {
            sentence: "2. She {{w3}} to the park.",
            placeholders: [
                { id: 'w3', options: ['goes', 'went', 'gone'], correctOptionIndex: 1 },
            ]
        }
    ]
  }

  public getParsedSentence(sentence: MissingWordSentence) {
    const regex = /{{(\w+)}}/g;
    const result: Array<string | MissingWordPlaceholder> = [];
    let lastIndex = 0;
    let match;

    while((match = regex.exec(sentence.sentence)) != null) {
        const id = match[1];

        

        if (match.index > lastIndex) {
            result.push(sentence.sentence.slice(lastIndex, match.index));
        }

        const placeholder = sentence.placeholders.find(p => p.id == id)
        if(placeholder) result.push(placeholder);

        lastIndex = regex.lastIndex
    }

    if(lastIndex < sentence.sentence.length) {
        result.push(sentence.sentence.slice(lastIndex))
    }

    return result
  }

  private checkAnswers() {
    return this.missingWordsData.sentences.flatMap(s => 
        s.placeholders.map(p => {
          const selected = this.answers[p.id];
          return {
              id: p.id,
              correct: p.options[p.correctOptionIndex] === selected?.option,
              selected: selected?.option,
              answer: p.options[p.correctOptionIndex],
          }
      })
    )
  }

  public showAnswers() {
    console.log(this.checkAnswers())
  }

  private buildOptions(): AnswerOption[] {
    let options = this.missingWordsData.sentences
      .flatMap(s => s.placeholders
      .flatMap(p => p.options.map(o => ({
        id: p.id,
        option: o,
        answered: false
      }))))

    return options
  }

  public toggleAnswerBlock(option: AnswerOption) {
    if(option.answered) return

    const currentAnswer = this.answers[this.selectedBlock];
    if(currentAnswer) {
      currentAnswer.answered = false;
    }

    this.answers[this.selectedBlock] = option;
    option.answered = true

    for(let [k,v] of Object.entries(this.answers)) {
      if (v==undefined) {
        this.selectedBlock = k
        return
      }
    }
  }

  public removeAnswer(id: string, event: Event) {
    event.stopPropagation();
    this.answers[id]!.answered = false
    this.answers[id] = undefined;
    this.selectedBlock = id
  }

  public getDropdownOptions(id: string, placeholders: MissingWordPlaceholder[]): DropdownItem[][] {
    return placeholders
      .filter(p => p.id == id)
      .map(p => p.options.map(o => ({
          title: o,
          onClick: () => {this.answers[p.id] = {
            id: p.id,
            option: o,
            answered: true
          }},
        })))
  }

  ngOnInit() {
    const buildOptions = this.buildOptions();
    this.options = shuffleArray(buildOptions);

    this.selectedBlock = buildOptions[0].id

    for(let i = 0; i < buildOptions.length;i++) {
      if(!this.answers[buildOptions[i].id]) {
        this.answers[buildOptions[i].id] = undefined
      }
    }
  }
}
