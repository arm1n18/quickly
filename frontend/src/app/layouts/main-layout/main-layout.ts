import { Component, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { AvatarComponent, CustomButtonComponent, CustomInputComponent, IconComponent } from "../../components/ui";
import { ModuleSummary } from '../../interfaces/module.interface';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';
import { AuthStateService } from '../../services/auth/authStateService/auth-state.service';
import { AsyncPipe } from '@angular/common';
import { Portal } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { AuthFormComponent } from '../../components';

interface ShowConfigInterface {
  showAuthModal: boolean;
  showSearchDropdown: boolean;
}

@Component({
  selector: 'app-main-layout',
  imports: [AsyncPipe, CustomButtonComponent, IconComponent, CustomInputComponent, AvatarComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {
  @ViewChild('loginModal') loginModal!: TemplateRef<any>;
  
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  public showConfig: ShowConfigInterface = {
    showAuthModal: false,
    showSearchDropdown: false,
  }

  constructor(
    public authState: AuthStateService,
    private apiService: ApiService,
    private router: Router,
    private portal: Portal
  ) {}

  public navigateToModule(id: number, e: Event) {
    e.stopPropagation()
    this.router.navigate([`/module/${id}`])
  }

  public findModules(text: string) {
    if(text.length == 0) return

    this.apiService.module.getModuleByName(text)
      .subscribe(modules => this.modules.set(modules.modules))
  }

  public toggleAuthModal(state: boolean) {
    if (state && !this.portal.isAnyOpen()) {
      this.portal.open(new ComponentPortal(AuthFormComponent), {

      });
    } else if (!state && this.portal.isAnyOpen()) {
      this.portal.close();
    }
  }
}
