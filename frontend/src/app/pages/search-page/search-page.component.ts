import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { ModuleSummary } from '../../interfaces/module.interface';
import { ModuleItemComponent } from "../../components";
import { DropdownComponent, SegmentedControlsComponent, DropdownItem } from "../../components/ui";
import { Keyword, KeywordsInputComponent } from "../../components/ui/keywords-input/keywords-input.component";
import { debounceTime, distinctUntilChanged, startWith, Subject, switchMap, tap } from 'rxjs';

type Limit = 'lessThanTwenty' | 'twentyToFifty' | 'moreThanFifty'

@Component({
  selector: 'app-search-page',
  imports: [MainLayout, ModuleItemComponent, DropdownComponent, SegmentedControlsComponent, KeywordsInputComponent],
  templateUrl: './search-page.html',
  styleUrl: './search-page.css',
})

export class SearchPageComponent implements OnInit {
  public modules: WritableSignal<ModuleSummary[]> = signal([]);
  private search$ = new Subject<string>();
  public searchValue: WritableSignal<string> = signal('');
  private kwSearch$ = new Subject<string>();
  
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
    this.router.navigate([], {
      queryParams: { title: text.length > 0 ? text : null },
      queryParamsHandling: 'merge'
    })

    this.search$.next(text)
    this.searchValue.set(text)
  }

  public search(text: string) {
    this.search$.next(text)
  }

  public changeSelectedKeywords(keywords: Keyword[]) {
    this.selectedKeywords.set(keywords);
    this.changeKeywordsQuery(keywords.map(k => k.slug))
  }

  get filteredKeywords(): Keyword[] {
    const all = this.keywords() ?? [];
    const selected = this.selectedKeywords() ?? [];

    const selectedSlugs = new Set(selected.map(k => k.slug));

    return all.filter(k => !selectedSlugs.has(k.slug));
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
      
      this.api.module.getModules(title, keywords, limit)
        .subscribe({
        next: resp => {
            this.modules.set(resp.modules)
          },
          error: err => {
            // if(!this.acceptedErrors.includes(err.status)) {
            //   this.router.navigate(["/not-found"], {replaceUrl: true})
            // }
            // this.errCode.set(err.status)
          }
      })
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

    this.search$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.changeSearchQuery(text)
        })
      )
      .subscribe();

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
}
