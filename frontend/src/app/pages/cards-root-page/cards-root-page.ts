import {Component, OnInit} from '@angular/core';
import {CardsState} from '../../state/cards-state/cards-state';
import {RouterOutlet} from '@angular/router';
import { ApiService } from '../../services/api/api.service';

@Component({
  standalone: true,
  selector: 'app-cards-root-page',
  imports: [RouterOutlet],
  templateUrl: './cards-root-page.html',
  styleUrl: './cards-root-page.css'
})

export class CardsRootPage implements OnInit {
  constructor(
    private cardsState: CardsState,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.apiService.module.getModule(1).subscribe(module => this.cardsState.setModule(module))
  }
}
