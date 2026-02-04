import { Component, ElementRef, HostListener } from '@angular/core';
import { AvatarComponent, ConfirmModalComponent, IconComponent } from "../ui";
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';
import { PortalService } from '../../services/portal/portal';
import { DropdownService } from '../../services/dropdownService/dropdown-service';
import { ComponentPortal } from '@angular/cdk/portal';
import { ApiService } from '../../services/api/api.service';
import { AuthService } from '../../services/auth/authService/auth.service';

@Component({
  selector: 'app-user-avatar',
  imports: [AvatarComponent, IconComponent],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.css',
})
export class UserAvatarComponent {
  constructor(
    public auth: AuthStateService,
    public authService: AuthService,
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
