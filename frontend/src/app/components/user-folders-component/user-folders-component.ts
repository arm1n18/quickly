import { Component, Input, OnInit, signal, WritableSignal } from '@angular/core';
import { ModuleItem } from "../ui/module-item/module-item";
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { UserInfo } from '../../interfaces/user.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';

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
  public username: WritableSignal<string> = signal("");
  
  constructor(
    private store: ProfileStateService,
    private route: ActivatedRoute
  ){}

  ngOnInit() {
    this.folders$ = this.store.folders$
    
    const username = this.route.parent?.snapshot.paramMap.get('username');
    if (username) {
      this.username.set(username);
    }
  }
}
