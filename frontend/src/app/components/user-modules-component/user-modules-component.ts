import { Component, Input } from '@angular/core';
import { ModuleItem } from "../ui/module-item/module-item";
import { Observable } from 'rxjs';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { AsyncPipe } from '@angular/common';

export interface UserModule {
  id: number;
  title: string;
  slug: string;
  objects: number;
  hasImages: boolean;
}

@Component({
  selector: 'app-user-modules-component',
  imports: [ModuleItem, AsyncPipe],
  templateUrl: './user-modules-component.html',
  styleUrl: './user-modules-component.css',
})

export class UserModulesComponent {
  public modules$!: Observable<UserModule[]>;

  constructor(private store: ProfileStateService){}

  ngOnInit() {
    this.modules$ = this.store.modules$
  }
}
