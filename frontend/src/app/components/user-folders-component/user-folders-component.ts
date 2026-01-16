import { Component, Input, OnInit } from '@angular/core';
import { ModuleItem } from "../ui/module-item/module-item";
import { Observable } from 'rxjs';
import { UserStoreService } from '../../services/userStoreService/user-store-service';
import { AsyncPipe } from '@angular/common';

export interface UserFolder {
  title: string;
  slug: string;
  objects: number;
}

@Component({
  selector: 'app-user-folders-component',
  imports: [ModuleItem, AsyncPipe],
  templateUrl: './user-folders-component.html',
  styleUrl: './user-folders-component.css',
})

export class UserFoldersComponent implements OnInit {
  public folders$!: Observable<UserFolder[]>;

  constructor(private store: UserStoreService){}

  ngOnInit() {
    this.folders$ = this.store.folders$
  }
}
