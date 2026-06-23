import { ContentBlock } from "../../cards/models/cards.interface";

export type GameMode = 'default' | 'match' | 'test' | 'flashcards'


export interface MatchCard {
  id: string;
  type: 'question' | 'answer';
  content: ContentBlock;
  pair: ContentBlock;
  match: boolean;
}

export interface TestAnswer extends ContentBlock {
  id?: string;
  isCorrect: boolean;
}

export interface TestQACard {
  question: ContentBlock;
  answers: TestAnswer[];
}

export interface TestTFCard {
  question: ContentBlock;
  answer: TestAnswer;
}

export interface TestInputCard {
  question: ContentBlock;
  answer: ContentBlock;
}

export interface TestMatchCard {
  question: ContentBlock;
  answer: ContentBlock;
}

export interface TestResult {
  correct: number[];
  incorrect: number[];
  answered: number;
  answers: (string | undefined)[];
}

export type TestMap = {
  choose: TestQACard[];
  tf: TestTFCard[];
  input: TestInputCard[];
  match: {
    questions: TestMatchCard[];
    answers: ContentBlock[];
  };
}; 

export type TestItem<T> = T extends (infer R)[] ? R : never