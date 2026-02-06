import { Component, ElementRef, OnInit, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileStateService } from '../../services/profileStateService/profile-state.service';
import { FolderSummary } from '../../interfaces/folder.interface';
import { FolderItemComponent } from "../folder-item/folder-item.component";
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-user-folders-component',
  imports: [FolderItemComponent],
  templateUrl: './user-folders-component.html',
  styleUrl: './user-folders-component.css',
})

export class UserFoldersComponent implements OnInit {
  @ViewChildren('item') items!: QueryList<ElementRef<HTMLElement>>;
  public folders: WritableSignal<FolderSummary[]> = signal([]);
  public isLoading: WritableSignal<boolean> = signal(false);
  public hasMore: WritableSignal<boolean> = signal(true);

  public username: WritableSignal<string> = signal("");
  
  constructor(
    private store: ProfileStateService,
    private api: ApiService,
    private route: ActivatedRoute
  ){}

  ngOnInit() {
    this.route.parent?.paramMap.subscribe(params => {
      const username = params.get('username');
      if (!username) return;

      this.username.set(username);
    });


    this.store.folders$.subscribe(folders => {
      if(folders.length == 0) {
        this.loadFolders();
      } else {
        this.folders.set(folders)
      }
    })
  }

  private loadFolders(id?: number) {
    if (!this.hasMore() || this.isLoading()) return;

    this.isLoading.set(true)

    this.api.folder.getUserFolders(this.username(), undefined, id)
      .subscribe(resp => {
        if(resp.folders.length == 0 || resp.folders.length < 10) {
          this.hasMore.set(false)
        }

        this.store.addFolders(resp.folders);
        
        this.isLoading.set(false)
      })
  }

  ngAfterViewInit() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || this.isLoading() || !this.hasMore()) return;

        const index = this.items.toArray()
          .findIndex(i => i.nativeElement === entry.target);

        if (index === -1) return;

        const trigger = this.folders().length - 5;
        const lastFolder = this.folders()[this.folders().length - 1];

        if(index >= trigger && lastFolder && !this.isLoading()) {
          this.loadFolders(lastFolder.id)

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
