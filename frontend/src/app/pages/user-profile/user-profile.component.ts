import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { ApiService } from '../../services/api/api.service';
import { UserInfo } from '../../interfaces/user.interface';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { debounceTime, distinctUntilChanged, forkJoin, Observable, Subject, switchMap, tap } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { SegmentedControlsComponent, CustomInputComponent,  AvatarComponent } from '../../components/ui';
import { Segment } from '../../components/ui/segmented-controls/segmented-controls.component';
import { Footer } from "../../layouts/footer/footer";
import { UserModule } from '../../interfaces/module.interface';
import { FolderSummary } from '../../interfaces/folder.interface';

@Component({
  selector: 'app-user-profile',
  imports: [AsyncPipe, AvatarComponent, MainLayout, SegmentedControlsComponent, CustomInputComponent, RouterOutlet, Footer],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})

export class UserProfile implements OnInit {
  public selectedSegment: number = 0;
  public user$!: Observable<UserInfo | null>;
  private search$ = new Subject<string>();

  private username = "";

  public modules: WritableSignal<UserModule[]> = signal([]);
  public folders: WritableSignal<FolderSummary[]> = signal([]);

  public segments: Segment[] = [
    { title: 'Модулі' },
    { title: 'Папки' }
  ]

  constructor(
    private store: ProfileStateService, 
    private apiService: ApiService, 
    private route: ActivatedRoute,
    private router: Router
  ) {}

  public onSegmentChange(index: number) {
    this.search$.next('')
    this.selectedSegment = index;
    this.router.navigate(
      [index === 0 ? 'modules' : 'folders'],
      { relativeTo: this.route }
    )
  }

  public search(text: string) {
    this.search$.next(text)
  }

  ngOnInit() {
    this.user$ = this.store.user$;

    this.route.url.subscribe(segments => {
      this.selectedSegment = segments.at(-1)?.path === "folders" ? 1 : 0; 
    })

    this.username = this.route.snapshot.paramMap.get('username')!

    forkJoin({
      user: this.apiService.user.getUserProfile(this.username),
      modules: this.apiService.module.getUserModules(this.username),
      folders: this.apiService.folder.getUserFolders(this.username)
    }).subscribe(({user, modules, folders}) => {
      this.store.setUser(user);
      this.store.setFolders(folders.folders);
      this.store.setModules(modules.modules);
    })

    this.search$
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(text => {
        return this.apiService.module.getUserModules(this.username, text)
            .pipe(tap(modules => this.store.setModules(modules.modules)));
      })
    )
    .subscribe();
  }
}
