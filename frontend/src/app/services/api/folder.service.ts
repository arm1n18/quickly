import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Folder, FoldersSummary } from '../../interfaces/folder.interface';

@Injectable({
  providedIn: 'root',
})

export class FolderService {
  private apiRoute = '/folder';

  constructor(private http: HttpClient) {}

  public getUserFolders(username: string, name?: string, lastId?: number): Observable<FoldersSummary> {
    const p = new URLSearchParams();
    if(name) p.append("name", name)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<FoldersSummary>(`/user/${username}/folders${query}`)
  }

  public getFolder(username: string, slug: string): Observable<Folder> {
    return this.http.get<Folder>(`/user/${username}/folder/${slug}`)
  }
}
