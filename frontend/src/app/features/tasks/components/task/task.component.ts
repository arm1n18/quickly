import { Component, Input, TemplateRef } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';
import { PortalService } from 'app/core/services/portal/portal.service';
import { Task } from 'app/features/ideas/models/ideas.interface';
import { ModalComponent } from 'app/shared/ui';

@Component({
  selector: 'app-task',
  imports: [],
  templateUrl: './task.component.html',
  styleUrl: './task.component.css',
})
export class TaskComponent {
  constructor(private portal: PortalService){}

  @Input({required: true}) task: Task | null = null;

  public openFull(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        template: template
      }
    })
  }
}
