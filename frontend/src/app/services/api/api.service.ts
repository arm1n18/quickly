import { inject, Injectable } from '@angular/core';
import { ModuleService } from './module.service';
import { UserService } from './user.service';
import { FolderService } from './folder.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class ApiService {
  public module = inject(ModuleService);
  public folder = inject(FolderService);
  public user = inject(UserService);
  public auth = inject(AuthService);
}
