import { Component, ElementRef, HostListener } from '@angular/core';
import { AvatarComponent, IconComponent } from "../ui";
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';
import { PortalService } from '../../services/portal/portal';
import { DropdownService } from '../../services/dropdownService/dropdown-service';

@Component({
  selector: 'app-user-avatar',
  imports: [AvatarComponent, IconComponent],
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.css',
})
export class UserAvatarComponent {
  constructor(
    public auth: AuthStateService,
    private elementRef: ElementRef,
    private dropdown: DropdownService
  ) {}

  private id: symbol = Symbol();
  public show: boolean = false;

  public toggleShow (e: Event) {
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target)
    if (!clickedInside) {
      this.close()
    }
  }
}
