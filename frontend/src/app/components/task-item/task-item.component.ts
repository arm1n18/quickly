import { Component, Input, TemplateRef } from '@angular/core';
import { Task } from '../../interfaces/ideas.interface';
import { PortalService } from '../../services/portal/portal';
import { ComponentPortal } from '@angular/cdk/portal';
import { ModalComponent } from '../ui';

@Component({
  selector: 'app-task-item',
  imports: [],
  templateUrl: './task-item.html',
  styleUrl: './task-item.css',
})
export class TaskItemComponent {
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
