import { Injectable } from '@angular/core';
import { UserModule } from '../../components/user-modules-component/user-modules-component';
import { UserFolder } from '../../components/user-folders-component/user-folders-component';
import { UserInfo } from '../../interfaces/user.interface';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class ProfileStateService {
  private _user$ = new BehaviorSubject<UserInfo | null>(null);
  public user$ = this._user$.asObservable();

  public setUser(user: UserInfo) {
    this._user$.next(user);
  }

  private _modules$ = new BehaviorSubject<UserModule[]>([]);
  public modules$ = this._modules$.asObservable();

  public addModules(modules: UserModule[]) {
    this._modules$.next([...this._modules$.value, ...modules]);
  }

  public setModules(modules: UserModule[]) {
    this._modules$.next(modules);
  }

  private _folders$ = new BehaviorSubject<UserFolder[]>([]);
  public folders$ = this._folders$.asObservable();

  public addFolders(folders: UserFolder[]) {
    this._folders$.next([...this._folders$.value, ...folders]);
  }

  public setFolders(folders: UserFolder[]) {
    this._folders$.next(folders);
  }

}
