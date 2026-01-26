import { Component, Input } from '@angular/core';
import { ModuleItem } from "../ui/module-item/module-item";
import { Observable } from 'rxjs';
import { UserStoreService } from '../../services/userStoreService/user-store-service';
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

  constructor(private store: UserStoreService){}

  ngOnInit() {
    this.modules$ = this.store.modules$
  }
}
