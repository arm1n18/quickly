import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { CustomButton, Icon } from "../ui";
import { NgClass } from '@angular/common';
import { CustomInput } from "../ui/custom-input/custom-input";
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormArray } from '@angular/forms';
import { OtpInput } from "../ui/otp-input/otp-input";
import { timer } from 'rxjs/internal/observable/timer';
import { Subject, takeUntil, takeWhile, tap } from 'rxjs';
import { ApiService } from '../../services/api/api.service';
import { LocalStorageService } from '../../services/localstorage/localStorage.service';

@Component({
  selector: 'app-auth-form',
  imports: [CustomButton, Icon, NgClass, ReactiveFormsModule, CustomInput, OtpInput],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.css',
})
export class AuthForm {
  @Input({ required: true }) show: boolean = false;
  @Output() shownChange = new EventEmitter<boolean>();

  public isRegisterMode: WritableSignal<boolean> = signal(false);
  public isReceiveCode: WritableSignal<boolean> = signal(false);

  public timer: WritableSignal<number> = signal(0);
  private stopTimer$ = new Subject<void>();

  public errorMessage: WritableSignal<string | null> = signal(null);
  public isLoading = false;

  public codeGenerations = {
    requests: 1,
    attempts: 0
  }

  private prevEmail: string = ''
  authForm = new FormGroup<{
    email: FormControl<string>,
    password: FormControl<string>;
    code?:  FormArray<FormControl<string>>;
  }>({
    email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(50)]
    })
  })

  constructor(
    private apiService: ApiService,
    private localStorage: LocalStorageService,
  ){}

  public closeModal(e: Event) {
    e.stopPropagation();
    this.shownChange.emit(false);
  }

  public toggleMode(register: boolean) {
    if(this.isLoading) return

    this.isRegisterMode.set(register);
  }

  public startTimer(): void {
    const duration = 60;
    const start = performance.now();

    timer(0,100).pipe(
      takeUntil(this.stopTimer$),
      tap(() => {
        const elapsed =  Math.floor((performance.now()-start) / 1000);
        const remaining = Math.max(duration-elapsed, 0)
        this.timer.set(remaining)

        if (remaining === 0) {
          this.stopTimer$.next();
        }
      })
    ).subscribe();
  }

  public stopTimer(): void {
    this.stopTimer$.next();
  }

  public sendData() {
    if(this.isLoading) return

    this.isLoading = true

    this.apiService.auth.auth(
        this.isRegisterMode() ? 'register' : 'login',
        this.authForm.get('email')!.value,
        this.authForm.get('password')!.value
    ).subscribe({
        next: resp => {
          this.isLoading = false
          this.errorMessage.set(null)
          if (resp.success) {
            this.receiveCodeStage();
          }
        },
        error: err => {
          this.isLoading = false
          this.errorMessage.set(err.error?.message || 'Щось пішло не так')
        }
    })
  }

  private receiveCodeStage() {
    const currentEmail = this.authForm.get('email')!.value;

    if (this.prevEmail && this.prevEmail !== currentEmail) {
      this.codeGenerations = {
        attempts: 0,
        requests: 1,
      };
    }
    
    this.prevEmail = currentEmail;
    this.isReceiveCode.set(true);
    this.startTimer();
    this.addCodeControl()
  }

  private addCodeControl() {
    if (!this.authForm.contains('code')) {
      this.authForm.addControl(
        'code', new FormArray<FormControl<string>>(
          Array.from({ length: 6 }, () =>
            new FormControl('', { nonNullable: true })
          )
        ),
      );
    }
  }

  public onOtpChange(event: { id: number; value: string }) {
    const codeArray = this.authForm.get('code') as FormArray;
    codeArray.at(event.id).setValue(event.value);
  }

  public newAttempt(){
    if(this.isLoading) return

    const code = Number(this.authForm.get('code')!.value?.join(''))

    this.isLoading = true
    this.apiService.auth.verify({
        email: this.authForm.get('email')!.value,
        code: code,
        purpose: this.isRegisterMode() ? 'register' : 'login'
      }
    ).subscribe({
        next: resp => {
          this.isLoading = false
          this.errorMessage.set(null)
          this.localStorage.setToLocalStorage("token", resp)
          this.shownChange.emit(false);
        },
        error: err => {
          this.isLoading = false
          this.errorMessage.set(err.error?.message || 'Щось пішло не так')
        }
    })
    
    this.codeGenerations.attempts++
  }

  public generateNewCode() {
    if(this.isLoading) return

    if(this.codeGenerations.requests >= 5) {
      return
    }

    this.isLoading = true
    this.apiService.auth.resendCode(
        this.authForm.get('email')!.value,
        this.isRegisterMode() ? 'register' : 'login'
    ).subscribe({
        next: resp => {
          this.isLoading = false
          this.errorMessage.set(null)
          this.codeGenerations.requests++
          if(this.codeGenerations.requests < 5) {
            this.startTimer()
          }
        },
        error: err => {
          this.isLoading = false
          this.codeGenerations.requests++
          this.errorMessage.set(err.error?.message || 'Щось пішло не так')
        }
    })
  }

  public returnToChangeData() {
    this.isReceiveCode.set(false)
  }

  get remainingAttempts() {
    return 5 - this.codeGenerations.attempts;
  }

  get remainingGenerations() {
    return 5 - this.codeGenerations.requests;
  }
}
