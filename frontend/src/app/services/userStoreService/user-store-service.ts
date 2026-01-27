import { Injectable, signal, WritableSignal } from '@angular/core';
import { UserModule } from '../../components/user-modules-component/user-modules-component';
import { UserFolder } from '../../components/user-folders-component/user-folders-component';
import { UserInfo } from '../../interfaces/user.interface';
import { ApiService } from '../api/api.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class UserStoreService {
  private _user$ = new BehaviorSubject<UserInfo | null>(null);
  public user$ = this._user$.asObservable();

  public setUser(user: UserInfo) {
    this._user$.next(user);
  }

  private _modules$ = new BehaviorSubject<UserModule[]>([]);
  modules$ = this._modules$.asObservable();

  addModules(modules: UserModule[]) {
    this._modules$.next([...this._modules$.value, ...modules]);
  }

  setModules(modules: UserModule[]) {
    this._modules$.next(modules);
  }

  private _folders$ = new BehaviorSubject<UserFolder[]>([]);
  folders$ = this._folders$.asObservable();

  addFolders(folders: UserFolder[]) {
    this._folders$.next([...this._folders$.value, ...folders]);
  }

  setFolders(folders: UserFolder[]) {
    this._folders$.next(folders);
  }

}
