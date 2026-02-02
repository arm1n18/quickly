import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { AsyncPipe } from '@angular/common';
import { UserModule } from '../../interfaces/module.interface';
import { ModuleItemComponent } from "../module-item/module-item.component";

@Component({
  selector: 'app-user-modules-component',
  imports: [AsyncPipe, ModuleItemComponent],
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
