import { Component, EventEmitter, Input, Output, signal, WritableSignal } from '@angular/core';
import { CustomButton, Icon } from "../ui";
import { NgClass } from '@angular/common';
import { CustomInput } from "../ui/custom-input/custom-input";
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { OtpInput } from "../ui/otp-input/otp-input";
import { timer } from 'rxjs/internal/observable/timer';
import { Subject, takeUntil, takeWhile, tap } from 'rxjs';

@Component({
  selector: 'app-auth-form',
  imports: [CustomButton, Icon, NgClass, ReactiveFormsModule, CustomInput, OtpInput],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.css',
})
export class AuthForm {
  @Input({ required: true }) show: boolean = false;
  @Output() shownChange = new EventEmitter<boolean>();

  public isRegisterMode = false;
  public isReceiveCode = false;

  public timer: WritableSignal<number> = signal(0);
  private stopTimer$ = new Subject<void>();

  public codeGenerations = {
    requests: 1,
    attempts: 0
  }

  private prevEmail: string = ''
  authForm = new FormGroup<{
    email: FormControl<string>,
    password: FormControl<string>;
    code?: FormControl<number>;
  }>({
    email: new FormControl('', {nonNullable: true, validators: [Validators.required, Validators.email]}),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6), Validators.maxLength(50)]
    })
  })

  public closeModal(e: Event) {
    e.stopPropagation();
    this.shownChange.emit(false);
  }

  public toggleMode(register: boolean) {
    this.isRegisterMode = register;
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
    const currentEmail = this.authForm.get('email')?.value || '';

    if (this.prevEmail && this.prevEmail !== currentEmail) {
      this.codeGenerations = {
        attempts: 0,
        requests: 1,
      };

      this.startTimer();
    }

    this.prevEmail = currentEmail;
    this.isReceiveCode = true;
  }

  public newAttempt(){
    this.codeGenerations.attempts++
  }

  public generateNewCode() {
    if(this.codeGenerations.requests >= 5) {
      return
    }
    this.codeGenerations.requests++
    if(this.codeGenerations.requests < 5) {
      this.startTimer()
    }
  }

  public returnToChangeData() {
    this.isReceiveCode = false
  }

    get remainingAttempts() {
    return 5 - this.codeGenerations.attempts;
  }

  get remainingGenerations() {
    return 5 - this.codeGenerations.requests;
  }
}
