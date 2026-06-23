import { ApiService } from 'app/core/api/api.service';
import { HeaderComponent } from 'app/shared/components';
import { CardsState } from 'app/features/modules/state/module.state';
import {Component, OnInit, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-cards-root-page',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './cards-root.page.html',
  styleUrl: './cards-root.page.css'
})

export class CardsRootPageComponent implements OnInit {
  public errCode: WritableSignal<number | null> = signal(null);
  private acceptedErrors = [500, 403, 404];
  
  constructor(
    private cardsState: CardsState,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get("id");
      if (!idStr) return;

      const id = Number(idStr);

      this.api.module.getModule(id)
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
