import { DropdownService } from 'app/core/services/dropdown/dropdown.service';
import { PortalService } from 'app/core/services/portal/portal.service';
import { ApiService } from 'app/core/api/api.service';
import { ConfirmModalComponent, AvatarComponent, IconComponent } from 'app/shared/ui';
import { ComponentPortal } from '@angular/cdk/portal';
import { Component, ElementRef, HostListener } from '@angular/core';
import { AuthStateService } from 'app/features/auth/state/auth.state';
import { AuthApiService } from 'app/features/auth/services/auth-api.service';

@Component({
  selector: 'app-user-avatar',
  imports: [AvatarComponent, IconComponent],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.css',
})
export class UserAvatarComponent {
constructor(
    public auth: AuthStateService,
    public authService: AuthApiService,
    private elementRef: ElementRef,
    private portal: PortalService,
    private dropdown: DropdownService,
    private api: ApiService
  ) {}

  private id: symbol = Symbol();
  public show: boolean = false;

  public toggleShow () {
    this.show = !this.show

    if (this.show) {
      this.dropdown.open(this.id, this);
    } else {
      this.dropdown.close(this.id, this);
    }
  }

  public close() {
    this.show = false;
  }

  public openLogoutModal() {
    this.close()

    this.portal.open(new ComponentPortal(ConfirmModalComponent), {
      title: 'Вийти з облікового запису?', 
      description: 'Поточну сесію буде завершено. Ви зможете увійти знову будь-коли.',
      onConfirm: () => this.onLogout()
    })
  }

  private onLogout() {
    this.api.auth.logout()
      .subscribe({
        next: () => {
          this.authService.logout();
          this.portal.close();
        },
        error: err =>  {
          console.log(err)
        },
      })
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    if (!clickedInside) {
      this.close()
    }
  }
}
