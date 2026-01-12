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
    { title: { 
        text: 'клітина'
      },
      description: { text: 'Структурна та функціональна одиниця живого.',
        media: { 
          type: 'image',
          content: 'https://media.istockphoto.com/id/1370146608/ru/%D1%84%D0%BE%D1%82%D0%BE/3d-%D0%B6%D0%B8%D0%B2%D0%B0%D1%8F-%D0%BA%D0%BB%D0%B5%D1%82%D0%BA%D0%B0.jpg?s=612x612&w=0&k=20&c=6UYfaxRgMWoQlriAJVY2Dgoq1r_iYrPU2tg-RzbRLXw='
        } 
      }
    },
    { title: { 
        text: 'мембрана'
      },
      description: { text: 'Тонка напівпроникна плівка, яка оточує цитоплазму та відповідає за надходження у клітину та виведення з неї різних речовин.',
        media: { 
          type: 'image',
          content: 'https://bioaa.info/wp-content/uploads/klet-membrana.jpg'
        } 
      }
    },
    { title: { 
        text: 'ядро'
      },
      description: { text: 'Головна частина клітини.',
        media: { 
          type: 'image',
          content: 'https://www.svitstyle.com.ua/wp-content/uploads/2025/11/yaki-funkcziyi-vykonuye-yadro.jpg'
        } 
      }
    },
    { title: { 
        text: 'мітохондрії'
      },
      description: { text: 'Здійснюють синтез енергії, двомембранний органоїд.',
        media: { 
          type: 'image',
          content: 'https://www.sciencelearn.org.nz/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F117510%2F1757397814-update_mitochondrion_1-sept-25.png%3Fw%3D1840%26h%3D1491.8918918918919&w=1920&q=85'
        } 
      }
    },
    { title: { 
        text: 'хлоропласти'
      },
      description: { text: 'Здійснюють процес фотосинтезу, двомембранний органоїд.',
        media: { 
          type: 'image',
          content: 'https://frukts.info/wp-content/uploads/2024/01/253292019.jpg'
        } 
      }
    },
    { title: { 
        text: 'апарат Гольджі'
      },
      description: { text: 'Зберігає поживні речовини, синтез лізосом.',
        media: { 
          type: 'image',
          content: 'https://p.turbosquid.com/ts-thumb/V0/XokFbh/Xm/1200/png/1663953079/300x300/sharp_fit_q85/01060a9e572ba0eae9fdb3fc1b403add56303323/1200.jpg'
        } 
      }
    }
  ];

  module: Module = {
    title: 'Біологія',
    cards: this.cards,
    keywords: [
      {
        title: "біологія",
        slug: "biologiya"
      },
      {
        title: "мікробіологія",
        slug: "microbiologiya"
      },
    ]
  }

  constructor(
    private cardsState: CardsState,
    private portalService: Portal
  ) {}

  ngOnInit() {
    this.cardsState.setModule(this.module);
  }
  
 
}
