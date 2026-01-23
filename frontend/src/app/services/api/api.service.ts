import { inject, Injectable } from '@angular/core';
import { ModuleService } from './module.service';

@Injectable({
  providedIn: 'root',
})

export class ApiService {
  public module = inject(ModuleService);
}
