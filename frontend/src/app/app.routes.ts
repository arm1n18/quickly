import { Routes } from '@angular/router';
import {CardsRootPage} from './pages/cards-root-page/cards-root-page.component';
import {CardsMatch, CardsPage} from './pages';
import {CardsTestPage} from './pages/cards-test-page/cards-test-page.component';
import { CardsPrintPage } from './pages/cards-print-page/cards-print-page.component';
import { FlashcardsPage } from './pages/flashcards-page/flashcards-page.component';
import { UserProfile } from './pages/user-profile/user-profile.component';
import { UserModulesComponent } from './components/user-modules-component/user-modules.component';
import { UserFoldersComponent } from './components/user-folders-component/user-folders.component';
import { FolderPage } from './pages/folder-page/folder-page.component';
import { CreateModulePage } from './pages/create-module-page/create-module-page.component';
import { UpdateModulePage } from './pages/update-module-page/update-module-page.component';
import { NotFoundPage } from './pages/not-found-page/not-found-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { MainPageComponent } from './pages/main-page/main-page.component';
import { AuthGuard } from './services/authGuard/auth-guard';
import { IdeasPageComponent } from './pages/ideas-page/ideas-page.component';
import { TestInfoPageComponent } from './pages/test-info-page/test-info-page.component';
import { ModuleInfoPageComponent } from './pages/module-info-page/module-info-page.component';
import { SearchPageComponent } from './pages/search-page/search-page.component';
import { SettingsPageComponent } from './pages/settings-page/settings-page.component';

export const routes: Routes = [
  {
    path: '',
    component: MainPageComponent
  },
  {
    path: 'features',
    children: [
      {
        path: 'test',
        component: TestInfoPageComponent
      },
      {
        path: 'cards',
        component: ModuleInfoPageComponent
      },
    ]
  },
  {
    path: 'settings',
    component: SettingsPageComponent,
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
    component: CreateModulePage,
    canActivate: [AuthGuard]
  },
  {
    path: 'module/:id/update',
    component: UpdateModulePage,
    canActivate: [AuthGuard]
  },
  {
    path: 'search',
    component: SearchPageComponent,
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
  {
    path: 'ideas',
    component: IdeasPageComponent,
  },
  { path: 'not-found', component: NotFoundPage },
  { path: '**', component: NotFoundPage },
];
