import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ApiService } from 'app/core/api/api.service';
import { ProfileStateService } from 'app/features/user/state/profile-state.service';
import { HeaderComponent, FooterComponent } from 'app/shared/components';
import { AvatarComponent, SegmentedControlsComponent } from 'app/shared/ui';
import { UserInfo } from '../../models/user.interface';
import { Segment } from 'app/shared/ui/segmented-controls/segmented-controls.component';

@Component({
  selector: 'app-user-profile',
  imports: [
    AsyncPipe, 
    RouterOutlet, 
    AvatarComponent, 
    HeaderComponent, 
    SegmentedControlsComponent, 
    FooterComponent,
  ],
  templateUrl: './user-profile.page.html',
  styleUrl: './user-profile.page.css',
})

export class UserProfilePageComponent implements OnInit {
  public selectedSegment: WritableSignal<number> = signal(0);
  public user$!: Observable<UserInfo | null>;

  private username = "";

  public segments: Segment[] = [ { title: 'Модулі' }, { title: 'Папки' } ]

  constructor(
    private store: ProfileStateService, 
    private api: ApiService, 
    private route: ActivatedRoute,
    private router: Router
  ) {}

  public onSegmentChange(index: number) {
    this.selectedSegment.set(index);
    this.router.navigate(
      [index === 0 ? 'modules' : 'folders'],
      { relativeTo: this.route, replaceUrl: true }
    )
  }

  ngOnInit() {
    this.user$ = this.store.user$;

    const segments = document.URL.split("/")
    this.selectedSegment.set(segments[segments.length-1] == "folders" ? 1 : 0)
    this.username = this.route.snapshot.paramMap.get('username')!


    this.api.user.getUserProfile(this.username)
      .subscribe(user => {
        this.store.setUser(user);
      })
  }
}
