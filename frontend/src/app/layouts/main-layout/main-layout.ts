import { Component, signal, WritableSignal } from '@angular/core';
import { CustomButton, Icon } from "../../components/ui";
import { CustomInput } from '../../components/ui/custom-input/custom-input';
import { Avatar } from "../../components/ui/avatar/avatar";
import { ModuleSummary } from '../../interfaces/quizCard.interface';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';
import { AuthForm } from "../../components/auth-form/auth-form";
import { ModalStateService } from '../../services/modalStateService/modal-state-service';
import { AuthStateService } from '../../services/AuthStateService/auth-state-service';

interface ShowConfigInterface {
  showAuthModal: boolean;
  showSearchDropdown: boolean;
}

@Component({
  selector: 'app-main-layout',
  imports: [CustomButton, Icon, CustomInput, Avatar, AuthForm],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  public showConfig: ShowConfigInterface = {
    showAuthModal: false,
    showSearchDropdown: false,
  }

  constructor(
    public auth: AuthStateService,
    private apiService: ApiService,
    private router: Router,
    private modalState: ModalStateService
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
    if (state && !this.modalState.isAnyOpen()) {
      this.modalState.open();
      this.showConfig.showAuthModal = state;
    } else if (!state && this.modalState.isAnyOpen()) {
      this.modalState.close();
      this.showConfig.showAuthModal = state;
    }
  }
}
