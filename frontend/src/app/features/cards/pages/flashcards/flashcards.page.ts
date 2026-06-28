import { Component, computed, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComponentPortal } from '@angular/cdk/portal';
import { DropdownComponent,ButtonComponent, IconComponent, ModalComponent } from 'app/shared/ui';
import { Module } from 'app/features/modules/models/module.interface';
import { CardsComponent } from '../../components';
import { DropdownItem } from 'app/shared/ui/dropdown/dropdown.component';
import { PortalService } from 'app/core/services/portal/portal.service';
import { GameMode } from 'app/features/test/models/test-card.interface';
import { CardsState } from 'app/features/modules/state/module.state';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-flashcards-page',
  imports: [NgStyle, NgClass, DropdownComponent, ButtonComponent, IconComponent, CardsComponent],
  templateUrl: './flashcards.page.html',
  styleUrl: './flashcards.page.css',
})

export class FlashcardsPageComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private state = inject(CardsState);
  private portal = inject(PortalService);

  @ViewChild(CardsComponent) cards!: CardsComponent;
  
  readonly module = toSignal(this.state.module$, { initialValue: null });
  public index = signal(0);

  public progress = computed(() => {
    const total = this.module()?.cards.length ?? 1;
    return (this.index() / (total - 1)) * 100;
  });

  readonly show = signal({
    settingsModal: false,
    shortcut: false,
  });

  public config = signal({
    frontSide: 'title' as 'title' | 'description',
    dualCard: false,
  });

  public dropdownList: DropdownItem[][] = [
    [ 
      { 
        preselected: true,
        title: {text: 'Картки'}, 
        icon : { name: 'Slider', color: 'var(--accent)'},
        onClick: () => this.changeGameMode('flashcards'),
      },
      { 
        title: {text: 'Підбір'}, 
        icon : { name: 'Notes', color: 'var(--accent)'},
        onClick: () => this.changeGameMode('match'), 
      },
      { 
        title: {text: 'Тестування'}, 
        icon : { name: 'Document', color: 'var(--accent)'},
        onClick: () => this.changeGameMode('test'), 
      },
    ],
      [
        { 
          title: {text: 'Головна'}, 
          icon : { name: 'House', color: 'var(--accent)'},
          onClick: () => this.changeGameMode('default'),
        }  
    ]
  ]

  public dropdownList2: DropdownItem[][] = [
    [
      { 
        title: {text: 'Термін'}, 
        preselected: this.config().frontSide === 'title',
        onClick: () => this.updateConfig('frontSide', 'title')
      },
      { 
        preselected: this.config().frontSide === 'description',
        title: {text: 'Визначення'}, 
        onClick: () => this.updateConfig('frontSide', 'description'), 
      }
    ]
  ]

  public updateConfig<K extends keyof ReturnType<typeof this.config>>(
    key: K,
    value: ReturnType<typeof this.config>[K]
  ) {
    this.config.update(c => ({
      ...c,
      [key]: value,
    }));
  }

  public updateShowConfig<K extends keyof ReturnType<typeof this.show>>(
    key: K,
    value: ReturnType<typeof this.show>[K]
  ) {
    this.show.update(c => ({
      ...c,
      [key]: value,
    }));
  }


  public openModal(template: TemplateRef<any>) {
    this.portal.open(new ComponentPortal(ModalComponent), {
      config: {
        showCross: true,
        title: 'Параметри',
        template: template
      }
    })
  }
  
  public changeGameMode(mode: GameMode) {
    switch (mode) {
      case 'default':
        void this.router.navigate(['../'], { relativeTo: this.route });
        break;
      case 'test':
        void this.router.navigate(['../test'], { relativeTo: this.route });
        break;
      case 'match':
        void this.router.navigate(['../match'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }


}
