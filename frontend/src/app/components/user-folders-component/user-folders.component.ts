import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { ModuleItemComponent } from '../ui';

export interface UserFolder {
  title: string;
  slug: string;
  objects: number;
}

@Component({
  selector: 'app-user-folders-component',
  imports: [ModuleItemComponent, AsyncPipe],
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
