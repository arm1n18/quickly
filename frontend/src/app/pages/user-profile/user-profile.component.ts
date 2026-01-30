import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { ApiService } from '../../services/api/api.service';
import { UserInfo } from '../../interfaces/user.interface';
import { UserModule } from '../../components/user-modules-component/user-modules.component';
import { UserFolder } from '../../components/user-folders-component/user-folders.component';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { SegmentedControlsComponent, CustomInputComponent,  AvatarComponent } from '../../components/ui';
import { Segment } from '../../components/ui/segmented-controls/segmented-controls.component';
import { Footer } from "../../layouts/footer/footer";

@Component({
  selector: 'app-user-profile',
  imports: [AsyncPipe, AvatarComponent, MainLayout, SegmentedControlsComponent, CustomInputComponent, RouterOutlet, Footer],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})

export class UserProfile implements OnInit {
  public selectedSegment: number = 0;
  public user$!: Observable<UserInfo | null>;

  private username = ""
  
  public modules: WritableSignal<UserModule[]> = signal([{
    id: 1,
    title: 'Біологія',
    slug: 'da',
    objects: 1,
    hasImages: false
  }]);
  public folders: WritableSignal<UserFolder[]> = signal([{
    title: 'Природничі науки',
    slug: 'da',
    objects: 1,
  }]);

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
    this.selectedSegment = index;
    this.router.navigate(
      [index === 0 ? 'modules' : 'folders'],
      { relativeTo: this.route }
    )
  }

  public searchByName(text: string) {
    if(this.selectedSegment == 0) {
      this.apiService.module.getUserModules(this.username, text)
        .subscribe(modules => this.store.setModules(modules.modules))
    } else {
      this.apiService.folder.getUserFolders(this.username, text)
        .subscribe(folders => this.store.setFolders(folders.folders))
    }
  }

  ngOnInit() {
    this.user$ = this.store.user$;

    this.route.url.subscribe(segments => {
      this.selectedSegment = segments.at(-1)?.path === "folders" ? 1 : 0; 
    })

    this.username = this.route.snapshot.paramMap.get('username')!

    this.apiService.user.getUserProfile(this.username)
      .subscribe(user => this.store.setUser(user))

    this.apiService.folder.getUserFolders(this.username)
      .subscribe(folders => this.store.setFolders(folders.folders))

    this.apiService.module.getUserModules(this.username)
      .subscribe(modules => this.store.setModules(modules.modules))
  }
}
