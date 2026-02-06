import { Routes } from '@angular/router';
import {CardsRootPage} from './pages/cards-root-page/cards-root-page.component';
import {CardsMatch, CardsPage} from './pages';
import {CardsTestPage} from './pages/cards-test-page/cards-test-page.component';
import { CardsPrintPage } from './pages/cards-print-page/cards-print-page.component';
import { FlashcardsPage } from './pages/flashcards-page/flashcards-page.component';
import { SelectMissingWordsPage } from './pages/select-missing-words-page/select-missing-words-page.component';
import { UserProfile } from './pages/user-profile/user-profile.component';
import { UserModulesComponent } from './components/user-modules-component/user-modules.component';
import { UserFoldersComponent } from './components/user-folders-component/user-folders.component';
import { FolderPage } from './pages/folder-page/folder-page.component';
import { CreateModulePage } from './pages/create-module-page/create-module-page.component';
import { UpdateModulePage } from './pages/update-module-page/update-module-page.component';
import { NotFoundPage } from './pages/not-found-page/not-found-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { MainPageComponent } from './pages/main-page/main-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainPageComponent
  },
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
    path: 'module/create',
    component: CreateModulePage
  },
  {
    path: 'module/:id/update',
    component: UpdateModulePage
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
  {
    path: 'reset/:token',
    component: ResetPasswordPageComponent,
  },
  { path: 'not-found', component: NotFoundPage },
  { path: '**', component: NotFoundPage },
];
