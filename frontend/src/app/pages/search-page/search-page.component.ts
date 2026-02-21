import { Component, ElementRef, OnInit, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { MainLayoutComponent } from "../../layouts/main-layout/main-layout.component";
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { ModuleSummary } from '../../interfaces/module.interface';
import { ModuleItemComponent } from "../../components";
import { DropdownComponent, DropdownItem } from "../../components/ui";
import { Keyword, KeywordsInputComponent } from "../../components/ui/keywords-input/keywords-input.component";
import { debounceTime, distinctUntilChanged, startWith, Subject, switchMap, tap } from 'rxjs';

type Limit = 'lessThanTwenty' | 'twentyToFifty' | 'moreThanFifty'

interface Query {
  title?: string;
  keywords?: string[];
  limit?: string;
  lastId?: number;
}

@Component({
  selector: 'app-search-page',
  imports: [MainLayoutComponent, ModuleItemComponent, DropdownComponent, KeywordsInputComponent],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})

export class SearchPageComponent implements OnInit {
  @ViewChildren('item') items!: QueryList<ElementRef<HTMLElement>>;
  
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  private search$ = new Subject<string>();
  public currentSearch: WritableSignal<string> = signal('');
  public hasMore: WritableSignal<boolean> = signal(true);
  private kwSearch$ = new Subject<string>();
  public isLoading: WritableSignal<boolean> = signal(false);
  private initialized: boolean = false;
  
  public dropdownListQT: WritableSignal<DropdownItem[][]> = signal([
    [
      {
        title: {text: 'Всі'}, onClick: () => this.changeLimitQuery(null),
      },
      {
        title: {text: '< 20 карток'}, onClick: () => this.changeLimitQuery('lessThanTwenty'),
      },
      {
        title: {text: '20-50 карток'}, onClick: () => this.changeLimitQuery('twentyToFifty'),
      },
      {
        title: {text: '50+ карток'}, onClick: () => this.changeLimitQuery("moreThanFifty"),
      }
    ]
  ]);

  public selectedKeywords: WritableSignal<Keyword[]> = signal([]);
  public keywords: WritableSignal<Keyword[]> = signal([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
  ){}

  private changeLimitQuery(limit: Limit | null) {
    this.router.navigate([], {
      queryParams: { limit: limit },
      queryParamsHandling: 'merge'
    })
  }

  private changeKeywordsQuery(keywords: string[]) {
    this.router.navigate([], {
      queryParams: { keywords: keywords.length > 0 ? keywords.join(',') : null },
      queryParamsHandling: 'merge'
    })
  }

  private changeSearchQuery(text: string) {
    // this.router.navigate([], {
    //   queryParams: { title: text.length > 0 ? text : null },
    //   queryParamsHandling: 'merge'
    // })

    // this.search$.next(text)
    // this.currentSearch.set(text)
  }

  public search(text: string) {
    this.search$.next(text)
  }

  public changeSelectedKeywords(keywords: Keyword[]) {
    this.selectedKeywords.set(keywords);
    this.changeKeywordsQuery(keywords.map(k => k.slug))
  }

  public searchKeywords(text: string) {
    this.kwSearch$.next(text)
  }

  private getLimitTitle(limit: string): string | null {
    switch (limit) {
      case 'lessThanTwenty': 
        return '< 20 карток'
      case 'twentyToFifty': 
        return '20-50 карток'
      case 'moreThanFifty': 
        return '50+ карток'
      default:
        return null
    }
  }

  private updatePreselectedLimit(limit?: string) {
    if (limit) {
      let title = this.getLimitTitle(limit)
      if(!title) title = 'Всі'

      const currentList = this.dropdownListQT()
      const updatedList = currentList[0].map(i => {
        if(i.title.text == title) {
          return {
            ...i,
            preselected: true
          }
        }
        
        return i
      })
      this.dropdownListQT.set([updatedList])
    }
  }

  private loadModules(merge: boolean, query: Query) {
    if (!this.hasMore() || this.isLoading()) return;

    this.isLoading.set(true);

    const {title, keywords, limit, lastId} = query;

    this.api.module.getModules(title, keywords, limit, lastId)
      .subscribe(resp => {
        if(resp.modules.length == 0 || resp.modules.length < 10) {
          this.hasMore.set(false)
        }

        if(merge) {
          const newModules = [...this.modules(), ...resp.modules];
          this.modules.set(newModules);
        } else {
          this.modules.set(resp.modules);
        }
        this.isLoading.set(false);
      })
  }

  get filteredKeywords(): Keyword[] {
    const all = this.keywords() ?? [];
    const selected = this.selectedKeywords() ?? [];

    const selectedSlugs = new Set(selected.map(k => k.slug));

    return all.filter(k => !selectedSlugs.has(k.slug));
  }
 
  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const title = params.get('title') || undefined;

      this.search$.next(title ?? '')

     let keywords = (this.route.snapshot.queryParams['keywords'] ?? '')
      .split(',')
      .filter((k: string) => k.trim() !== '')
      .slice(0, 10);

      if(!(keywords && keywords.length > 0)) {
        keywords = undefined
      }

      const limit = params.get('limit') || undefined;
      this.updatePreselectedLimit(limit);
      
      this.hasMore.set(true);
      this.loadModules(false, {
        title, keywords, limit
      });

      this.currentSearch.set(title ?? '')
    })

    let keywords: string[] = (this.route.snapshot.queryParams['keywords'] ?? '')
      .split(',')
      .filter((k: string) => k.trim() !== '')
      .slice(0, 10);
    if(keywords && keywords.length > 0) {
      this.api.module.getKeywordsBySlug(keywords)
        .subscribe({
          next: resp => {
            this.selectedKeywords.set(resp.keywords)
            this.changeKeywordsQuery(resp.keywords.map(kw => kw.slug))
          },
          error: () => {
            this.selectedKeywords.set([])
          }
        })
    } else {
      this.changeKeywordsQuery([])
    }

    // this.search$
    //   .pipe(
    //     debounceTime(500),
    //     distinctUntilChanged(),
    //     tap(text => {
    //       if (!this.initialized) {
    //         this.initialized = true; 
    //         return;
    //       }
    //       this.changeSearchQuery(text)
    //     })
    //   )
    //   .subscribe();

    this.kwSearch$
      .pipe(
        startWith(''),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(text => {
          return this.api.module.findKeywords(text.length > 0 ? text : undefined)
        }),
        tap(resp => {
          this.keywords.set(resp.keywords)
        })
      ).subscribe()
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || this.isLoading() || !this.hasMore()) return;

        const index = this.items.toArray()
          .findIndex(i => i.nativeElement === entry.target);

        if (index === -1) return;

        const trigger = this.modules().length - 3;
        const lastModule = this.modules()[this.modules().length - 1];

        if(index >= trigger && lastModule && this.modules().length >= 12 && !this.isLoading()) {
          const params = this.route.snapshot.queryParams
          const title: string | undefined = params['title'];
          let keywords: string[] | undefined = (params['keywords'] ?? '')
            .split(',')
            .filter((k: string) => k.trim() !== '')
            .slice(0, 10);
          
          if(!(keywords && keywords.length > 0)) {
            keywords = undefined
          }

          const limit: string | undefined = params['limit'] || undefined;

          this.loadModules(true, {title, keywords, limit, lastId: lastModule.id})

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
