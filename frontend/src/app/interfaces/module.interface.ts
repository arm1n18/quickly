import { UserInfo } from "./user.interface";

export type GameMode = 'default' | 'match' | 'test' | 'flashcards'

interface Keyword {
  name: string;
  slug: string;
}

export type MediaType = 'audio' | 'video' | 'image'

interface Media {
  type: MediaType;
  content: string;
}

export interface ContentBlock {
  text: string;
  media?: Media;
}

export interface Card {
  id: number;
  title: ContentBlock;
  description: ContentBlock;
}

interface Author {
  name: string;
}

export interface Module {
  id: number;
  title: string;
  slug: string;
  author: Author;
  isOwner: boolean;
  isSaved: boolean;
  keywords: Keyword[] | null;
  cards: Card[];
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
  choose: TestQACard[];
  tf: TestTFCard[];
  input: TestInputCard[];
  match: {
    questions: TestMatchCard[];
    answers: ContentBlock[];
  };
}; 

export type TestItem<T> = T extends (infer R)[] ? R : never

export interface UserModule {
  id: number;
  title: string;
  slug: string;
  objects: number;
  isOwner: boolean;
  isSaved: boolean;
  hasImages: boolean;
}

export interface UserModulesResponse {
  modules: UserModule[];
}

export interface ModuleSummary {
  id: number;
  title: string;
  slug: string;
  author: UserInfo;
  isOwner: boolean;
  isSaved: boolean;
  keywords: Keyword[];
  objects: number;
  hasImages: boolean;
}

export interface ModulesSummary {
  modules: ModuleSummary[];
}

export interface CreateModuleRequest {
  title: string;
  private: boolean;
  cards: Card[];
}