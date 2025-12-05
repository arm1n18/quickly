import { Routes } from '@angular/router';
import {CardsRootPage} from './pages/cards-root-page/cards-root-page';
import {CardsMatch, CardsPage} from './pages';
import {CardsTestPage} from './pages/cards-test-page/cards-test-page';

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
    ]
  },
];
