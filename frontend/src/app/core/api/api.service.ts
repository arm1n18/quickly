import { AuthApiService } from 'app/features/auth/services/auth-api.service';
import { FolderApiService } from 'app/features/folders/services/folder-api.service';
import { ModuleApiService } from 'app/features/modules/services/module-api.service';
import { UserApiService } from 'app/features/user/services/user-api.service';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class ApiService {
  public module = inject(ModuleApiService);
  public folder = inject(FolderApiService);
  public user = inject(UserApiService);
  public auth = inject(AuthApiService);
}
