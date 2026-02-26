import { Component, signal, WritableSignal } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { AvatarComponent, CustomInputComponent, CustomButtonComponent } from "../../components/ui";
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';
import { ApiService } from '../../services/api/api.service';
import { AsyncPipe } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth/authService/auth.service';

@Component({
  selector: 'app-settings-page',
  imports: [MainLayoutComponent, AvatarComponent, AsyncPipe, CustomInputComponent, ReactiveFormsModule, CustomButtonComponent],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPageComponent {
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

    const username = this.userInfoForm.get('username')?.value
    if(username) {
      this.isLoading = true

      this.api.user.changeUsername(username)
        .subscribe({
          next: resp => {
            this.authService.updateToken(resp.accessToken)
            this.isLoading = false
          },
          error: err => {
            console.log(err)
            this.errorMessage.set(err.error.message || 'Щось пішло не так')
            this.isLoading = false
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
      this.userInfoForm.get('username')?.setValue(payload?.username)
      this.userInfoForm.get('email')?.setValue(payload?.email)
    }
  }
}
