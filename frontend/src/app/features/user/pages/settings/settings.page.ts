import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStateService } from 'app/features/auth/state/auth.state';
import { HeaderComponent } from 'app/shared/components';
import { AvatarComponent, InputComponent, ButtonComponent } from 'app/shared/ui';
import { AuthService } from 'app/features/auth/services/auth.service';
import { ApiService } from 'app/core/api/api.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    AsyncPipe,
    HeaderComponent,
    AvatarComponent,
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.css',
})
export class SettingsPageComponent implements OnInit {
  public errorMessage: WritableSignal<string | null> = signal(null);
  public isLoading: boolean = false;
  
  public userInfoForm = new FormGroup<{
      username: FormControl<string>;
      email: FormControl<string>,
    }>({
      username: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.minLength(5), Validators.maxLength(25)]}),
      email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
  })

  constructor(
    public authState: AuthStateService,
    public authService: AuthService,
    private api: ApiService
  ) {}

  public changeUsername() {
    if(this.isLoading || !this.userInfoForm.valid) return

    const username = this.userInfoForm.controls.username.value;
    if(username) {
      this.isLoading = true;

      this.api.user.changeUsername(username)
        .subscribe({
          next: resp => {
            this.authService.updateToken(resp.accessToken);
            this.isLoading = false;
          },
          error: err => {
            this.errorMessage.set(err.error.message || 'Щось пішло не так');
            this.isLoading = false;
          }
        })
    }
  }

  get changed(): boolean {
    const payload = this.authState.payload;

    if(payload) {
      const {username, email} = payload;

      return this.userInfoForm.controls.email.value != email ||
      this.userInfoForm.controls.username.value != username
    }

    return false
  }

  ngOnInit() {
    const payload = this.authState.payload
    if(payload) {
      this.userInfoForm.controls.username.patchValue(payload?.username)
      this.userInfoForm.controls.email.patchValue(payload?.email)
    }
  }
}
