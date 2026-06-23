import { Component, Input, TemplateRef } from '@angular/core';
import { ComponentPortal } from '@angular/cdk/portal';import { ButtonComponent } from 'app/shared/ui/button/button.component';
import { AvatarComponent, IconComponent, ModalComponent } from 'app/shared/ui';
import { PortalService } from 'app/core/services/portal/portal.service';
import { Idea } from '../../models/ideas.interface';
;

@Component({
  selector: 'app-idea',
  imports: [
    ButtonComponent, 
    IconComponent,
    AvatarComponent,
  ],
  templateUrl: './idea.component.html',
  styleUrl: './idea.component.css',
})
export class IdeaComponent {
  constructor(private portal: PortalService){}

  @Input({required: true}) idea: Idea | null = null;

  public vote() {
    if(!this.idea) return
    this.idea.voted = !this.idea.voted
  }

  public openFull(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        template: template
      }
    })
  }
}
