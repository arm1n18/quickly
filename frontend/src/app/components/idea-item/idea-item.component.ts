import { Component, Input, TemplateRef } from '@angular/core';
import { CustomButtonComponent, IconComponent, ModalComponent, AvatarComponent } from "../ui";
import { ComponentPortal } from '@angular/cdk/portal';
import { PortalService } from '../../services/portal/portal';
import { Idea } from '../../interfaces/ideas.interface';

@Component({
  selector: 'app-idea-item',
  imports: [CustomButtonComponent, IconComponent, AvatarComponent],
  templateUrl: './idea-item.html',
  styleUrl: './idea-item.css',
})
export class IdeaItemComponent {
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
