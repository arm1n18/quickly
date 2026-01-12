export type GameMode = 'default' | 'match' | 'test' | 'flashcards'

type MediaType = 'audio' | 'video' | 'image'

interface Media {
  type: MediaType;
  content: string;
  alt?: string;
}

interface Keyword {
  title: string;
  slug: string;
}

export interface ContentBlock {
  text?: string;
  media?: Media;
}

export interface Module {
  title: string;
  keywords?: Keyword[];
  cards: Card[];
}

export interface Card {
  title: ContentBlock;
  description: ContentBlock;
}

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
  qa: TestQACard[];
  tf: TestTFCard[];
  input: TestInputCard[];
  match: {
    questions: TestMatchCard[];
    answers: ContentBlock[];
  };
}; 

export type TestItem<T> = T extends (infer R)[] ? R : never
