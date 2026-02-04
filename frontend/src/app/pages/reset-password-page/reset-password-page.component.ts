import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomInputComponent, CustomButtonComponent } from "../../components/ui";

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, CustomInputComponent, CustomButtonComponent],
  templateUrl: './reset-password-page.html',
  styleUrl: './reset-password-page.css',
})
export class ResetPasswordPageComponent {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ){}
  
  private token: string = "";

  resetForm = new FormGroup<{
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(50)]
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(50)]
    })
  })

  public openLogin() {
    this.router.navigate(["/"], { state: { login: true } })
  }

  public onReset() {
    const password = this.resetForm.get('password')!.value
    const confirmPassword = this.resetForm.get('confirmPassword')!.value

    if (password != confirmPassword) {
      // show error
      return 
    }

    this.api.auth.confirmReset(this.token, password)
      .subscribe({
        next: () => {
          this.openLogin()
        },
        error: () => {
          // set error
        }
      })
  }
  
  ngOnInit() {
    const urlToken = this.route.snapshot.paramMap.get('token')
    if(urlToken == null) {
      return
    }

    this.api.auth.validResetToken(urlToken)
      .subscribe({
        next: () => {
          this.token = urlToken 
        },
        error: () => {
          this.router.navigate(["/"])
        }
      })
  }
}
