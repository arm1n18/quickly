import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/pages';
import { TestInfoPageComponent } from './features/test/pages';
import { CreateModulePageComponent, ModuleInfoPageComponent, UpdateModulePageComponent } from './features/modules/pages';
import { SettingsPageComponent, UserProfilePageComponent } from './features/user/pages';
import { UserModulesComponent } from './features/modules/components';
import { UserFoldersComponent } from './features/folders/components';
import { FolderRootPage } from './features/folders/pages';
import { AuthGuard } from './core/guards/auth/auth.guard';
import { SearchPageComponent } from './features/search/pages';
import { CardsMatchPageComponent, CardsPrintPageComponent, CardsRootPageComponent, 
  CardsStudyPageComponent, CardsTestPageComponent, FlashcardsPageComponent } from './features/cards/pages';
import { ResetPasswordPageComponent } from './features/auth/pages';
import { IdeasRootPageComponent } from './features/ideas/pages';
import { NotFoundPageComponent } from './core/pages/not-found/not-found.page';


export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
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
    component: UserProfilePageComponent,
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
    component: FolderRootPage,
  },
  {
    path: 'module/create',
    component: CreateModulePageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'module/:id/update',
    component: UpdateModulePageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'search',
    component: SearchPageComponent,
  },
  {
    path: 'module/:id',
    component: CardsRootPageComponent,
    children: [
      {
        path: '',
        component: CardsStudyPageComponent,
      },
      {
        path: 'match',
        component: CardsMatchPageComponent,
      },
      {
        path: 'test',
        component: CardsTestPageComponent,
      },
      {
        path: 'flashcards',
        component: FlashcardsPageComponent,
      },
      {
        path: 'print',
        component: CardsPrintPageComponent,
      },
    ]
  },
  {
    path: 'reset/:token',
    component: ResetPasswordPageComponent,
  },
  {
    path: 'ideas',
    component: IdeasRootPageComponent,
  },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
