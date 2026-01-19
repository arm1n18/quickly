import { Routes } from '@angular/router';
import {CardsRootPage} from './pages/cards-root-page/cards-root-page';
import {CardsMatch, CardsPage} from './pages';
import {CardsTestPage} from './pages/cards-test-page/cards-test-page';
import { CardsPrintPage } from './pages/cards-print-page/cards-print-page';
import { FlashcardsPage } from './pages/flashcards-page/flashcards-page';
import { SelectMissingWordsPage } from './pages/select-missing-words-page/select-missing-words-page';
import { UserProfile } from './pages/user-profile/user-profile';
import { UserModulesComponent } from './components/user-modules-component/user-modules-component';
import { UserFoldersComponent } from './components/user-folders-component/user-folders-component';
import { FolderPage } from './pages/folder-page/folder-page';

export const routes: Routes = [
  {
    path: 'user/:username',
    component: UserProfile,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'modules'
      },
      {
        path: 'modules',
        component: UserModulesComponent
      },
      {
        path: 'folders',
        component: UserFoldersComponent
      }
    ]
  },
  {
    path: 'user/:username/folder/:slug',
    component: FolderPage,
  },
  {
    path: 'module/:id',
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
];
