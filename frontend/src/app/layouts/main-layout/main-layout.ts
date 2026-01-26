import { Component, signal, WritableSignal } from '@angular/core';
import { CustomButton, Icon } from "../../components/ui";
import { CustomInput } from '../../components/ui/custom-input/custom-input';
import { Avatar } from "../../components/ui/avatar/avatar";
import { ModuleSummary } from '../../interfaces/quizCard.interface';
import { ApiService } from '../../services/api/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [CustomButton, Icon, CustomInput, Avatar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  public show: WritableSignal<boolean> = signal(false);

  constructor(
    private apiService: ApiService,
    private router: Router
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
}
