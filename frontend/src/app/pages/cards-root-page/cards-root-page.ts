import {Component, OnInit} from '@angular/core';
import {CardsState} from '../../state/cards-state/cards-state';
import {ActivatedRoute, RouterOutlet} from '@angular/router';
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
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.paramMap
    this.apiService.module.getModule(Number(params.get("id")!))
      .subscribe(resp => this.cardsState.setModule(resp.module))
  }
}
