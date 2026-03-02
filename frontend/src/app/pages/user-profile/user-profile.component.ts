import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { ApiService } from '../../services/api/api.service';
import { UserInfo } from '../../interfaces/user.interface';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { SegmentedControlsComponent,  AvatarComponent } from '../../components/ui';
import { Segment } from '../../components/ui/segmented-controls/segmented-controls.component';
import { Footer } from "../../layouts/footer/footer";

@Component({
  selector: 'app-user-profile',
  imports: [AsyncPipe, AvatarComponent, MainLayoutComponent, SegmentedControlsComponent, RouterOutlet, Footer],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})

export class UserProfile implements OnInit {
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
