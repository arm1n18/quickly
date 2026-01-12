import { Routes } from '@angular/router';
import {CardsRootPage} from './pages/cards-root-page/cards-root-page';
import {CardsMatch, CardsPage} from './pages';
import {CardsTestPage} from './pages/cards-test-page/cards-test-page';
import { CardsPrintPage } from './pages/cards-print-page/cards-print-page';
import { FlashcardsPage } from './pages/flashcards-page/flashcards-page';
import { SelectMissingWordsPage } from './pages/select-missing-words-page/select-missing-words-page';

export const routes: Routes = [
  {
    path: ':id',
    component: CardsRootPage,
    children: [
      {
        path: '',
        component: CardsPage,
      },
      {
        path: 'match',
        component: CardsMatch,
      },
      {
        path: 'test',
        component: CardsTestPage,
      },
      {
        path: 'flashcards',
        component: FlashcardsPage,
      },
      {
        path: 'print',
        component: CardsPrintPage,
      },
    ]
  },
  {
    path: 'select-missing-words/:id',
    component: SelectMissingWordsPage,
  }
];
