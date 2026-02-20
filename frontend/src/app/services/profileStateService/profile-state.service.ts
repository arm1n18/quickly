import { Injectable } from '@angular/core';
import { UserInfo } from '../../interfaces/user.interface';
import { BehaviorSubject } from 'rxjs';
import { ModuleSummary, UserModule } from '../../interfaces/module.interface';
import { FolderSummary } from '../../interfaces/folder.interface';

@Injectable({
  providedIn: 'root',
})

export class ProfileStateService {
  private _user$ = new BehaviorSubject<UserInfo | null>(null);
  public user$ = this._user$.asObservable();

  public setUser(user: UserInfo) {
    this._user$.next(user);
  }

  public getUserByKey<T extends keyof UserInfo>(key: T): UserInfo[T] | null {
    if(!this._user$.value) return null
    return this._user$.value[key];
  }

  private _modules$ = new BehaviorSubject<ModuleSummary[]>([]);
  public modules$ = this._modules$.asObservable();

  public addModules(modules: ModuleSummary[]) {
    this._modules$.next([...this._modules$.value, ...modules]);
  }

  public setModules(modules: ModuleSummary[]) {
    this._modules$.next(modules);
  }

  public removeModule(id: number) {
    const updated = this._modules$.value.filter(m => m.id !== id);
    this._modules$.next(updated);
  }

  public updateModuleByKey<T extends keyof UserModule>(id: number, key: T, value: UserModule[T]) {
    const modules = this._modules$.value;
    const index = modules.findIndex(m => m.id === id);
    if (index === -1) return;

    const updated = [...modules];
    updated[index] = {
      ...modules[index],
      [key]: value,
    };

    this._modules$.next(updated);
  }

  private _folders$ = new BehaviorSubject<FolderSummary[]>([]);
  public folders$ = this._folders$.asObservable();

  public addFolders(folders: FolderSummary[]) {
    this._folders$.next([...this._folders$.value, ...folders]);
  }

  public setFolders(folders: FolderSummary[]) {
    this._folders$.next(folders);
  }

  public removeFolder(slug: string) {
    const updated = this._folders$.value.filter(f => f.slug !== slug);
    this._folders$.next(updated);
  }

  public updateFolder(slug: string, newFolder: FolderSummary) {
    const updated = this._folders$.value.map(f => {
      if(f.slug == slug) {
        return newFolder
      }

      return f
    });
    this._folders$.next(updated);
  }
}
