import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { Folder } from '../../interfaces/folder.interface';
import { ApiService } from '../../services/api/api.service';
import { ActivatedRoute } from '@angular/router';
import { MainLayout } from "../../layouts/main-layout/main-layout";
import { Avatar } from "../../components/ui/avatar/avatar";
import { Icon } from "../../components/ui";
import { ModuleItem } from "../../components/ui/module-item/module-item";

@Component({
  selector: 'app-folder-page',
  imports: [MainLayout, Avatar, Icon, ModuleItem],
  templateUrl: './folder-page.html',
  styleUrl: './folder-page.css',
})

export class FolderPage implements OnInit {
  public folder: WritableSignal<Folder | null> = signal(null);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
  ){}

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap
    this.apiService.folder.getFolder(params.get('username')!, params.get('slug')!)
      .subscribe(folder => this.folder.set(folder))
  }
}
