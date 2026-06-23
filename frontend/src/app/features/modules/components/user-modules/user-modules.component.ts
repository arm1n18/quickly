import { AfterViewInit, Component, ElementRef, OnInit, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { ModuleComponent } from "../module/module.component";
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap, tap } from 'rxjs';
import { ApiService } from 'app/core/api/api.service';
import { ProfileStateService } from 'app/features/user/state/profile-state.service';
import { InputComponent } from 'app/shared/ui';
import { ModuleSummary } from '../../models/module.interface';

@Component({
  selector: 'app-user-modules-component',
  imports: [
    ModuleComponent, 
    InputComponent,
  ],
  templateUrl: './user-modules.component.html',
  styleUrl: './user-modules.component.css',
})

export class UserModulesComponent implements OnInit, AfterViewInit {
  @ViewChildren('item') items!: QueryList<ElementRef<HTMLElement>>;
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  public isLoading: WritableSignal<boolean> = signal(false);
  public hasMore: WritableSignal<boolean> = signal(true);
  public username: WritableSignal<string> = signal("");

  private search$ = new Subject<string>();
  private currentSearch?: string = undefined

  constructor(
    private route: ActivatedRoute,
    private store: ProfileStateService,
    private api: ApiService,
  ){}


  public search(text: string) {
    this.search$.next(text)
  }

  private loadModules(search?: string, id?: number) {
    if (!this.hasMore() || this.isLoading()) return;

    this.isLoading.set(true)

    this.api.module.getUserModules(this.username(), search, id)
      .subscribe(resp => {
        if(resp.modules.length == 0 || resp.modules.length < 10) {
          this.hasMore.set(false)
        }

        this.store.addModules(resp.modules);
        this.isLoading.set(false)
      })
  }

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      const username = params.get('username');
      if (!username) return;

      this.username.set(username);
    });


    this.store.modules$.subscribe(modules => this.modules.set(modules.map(module => {
      return {
        ...module,
        author: {
          avatar: '',
          name: '',
        }
      }
    })));

    if (this.modules().length === 0) {
      this.loadModules();
    }

    this.search$
    .pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(text => {
        this.hasMore.set(true);
        return this.api.module.getUserModules(this.username(), text);
      }),
        tap(resp => {
          this.store.setModules(resp.modules);
        })
    )
    .subscribe();
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || this.isLoading() || !this.hasMore()) return;

        const index = this.items.toArray()
          .findIndex(i => i.nativeElement === entry.target);

        if (index === -1) return;

        const trigger = this.modules().length - 5;
        const lastModule = this.modules()[this.modules().length - 1];

        if(index >= trigger && lastModule && this.modules().length >= 10 && !this.isLoading()) {
          this.loadModules(this.currentSearch, lastModule.id)

          observer.unobserve(entry.target)
        }
      })
    },{
      threshold: 0.1
    })

    this.items.changes.subscribe((list: QueryList<ElementRef<HTMLElement>>) => {
      list.forEach(el => observer.observe(el.nativeElement));
    });
  }
}
