import {Component, OnInit, signal, WritableSignal} from '@angular/core';
import {CardsState} from '../../state/cards-state/cards-state';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { MainLayout } from "../../layouts/main-layout/main-layout";

@Component({
  standalone: true,
  selector: 'app-cards-root-page',
  imports: [RouterOutlet, MainLayout],
  templateUrl: './cards-root-page.html',
  styleUrl: './cards-root-page.css'
})

export class CardsRootPage implements OnInit {
  public errCode: WritableSignal<number | null> = signal(null);
  private acceptedErrors = [500, 403, 404];
  
  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get("id");
      if (!idStr) return;

      const id = Number(idStr);

      this.apiService.module.getModule(id)
        .subscribe({
        next: resp => {
            this.cardsState.setModule(resp.module)
          },
          error: err => {
            if(!this.acceptedErrors.includes(err.status)) {
              this.router.navigate(["/not-found"], {replaceUrl: true})
            }
            this.errCode.set(err.status)
          }
      })
    })
  }
}
