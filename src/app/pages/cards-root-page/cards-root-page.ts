import {Component, OnInit, ViewChild} from '@angular/core';
import {Card, Module} from '../../interfaces/quizCard.interface';
import {CardsState} from '../../state/cards-state/cards-state';
import {RouterOutlet} from '@angular/router';
import { CdkPortalOutlet, ComponentPortal } from '@angular/cdk/portal';
import { Portal } from '../../services/portal/portal';
import { ImageModal } from '../../components/ui/image-modal/image-modal';

@Component({
  selector: 'app-cards-root-page',
  imports: [RouterOutlet],
  templateUrl: './cards-root-page.html',
  styleUrl: './cards-root-page.css'
})

export class CardsRootPage implements OnInit {
  cards: Card[] = [
    { title: { text: 'автентичний' },
      description:
        { text: 'das Flugzeug, die Flugzeuge',
          media: { type: 'image',
            content: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExY3QzemI1dTdhNTZneWJrZzdncWFnaXIxbzRzOWFua3JuazZmODJocCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nk2C49mUNljb1scZgY/giphy.gif'
        } } },
    { title: { text: 'аеропорт' }, description: { text: 'летовище', media: { type: 'image', content: 'https://finance-news-media.fra1.cdn.digitaloceanspaces.com/prod/2/4/246388124ece7be07967d4c2a9bb0f87' } } },
    { title: { text: 'апелювати' }, description: { text: 'звертатися' } }
  ];

  module: Module = {
    title: 'Вивчення слів',
    cards: this.cards
  }

  constructor(
    private cardsState: CardsState,
    private portalService: Portal
  ) {}

  ngOnInit() {
    this.cardsState.setModule(this.module);
  }
  
 
}
