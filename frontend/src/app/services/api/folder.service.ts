import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Folder, FoldersSummary } from '../../interfaces/folder.interface';

@Injectable({
  providedIn: 'root',
})

export class FolderService {
  private apiRoute = '/folders';

  constructor(private http: HttpClient) {}

  public getUserFolders(username: string, name?: string, lastId?: number): Observable<FoldersSummary> {
    const p = new URLSearchParams();
    if(name) p.append("name", name)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<FoldersSummary>(`/user/${username}/folders${query}`)
  }

  public getFolder(username: string, slug: string): Observable<Folder> {
    return this.http.get<Folder>(`/user/${username}/folders/${slug}`)
  }

  public createFolder(username: string, body: {title: string}): Observable<{slug: string}> {
    return this.http.post<{slug: string}>(`/user/${username}/folders`, body)
  }

  public updateFolder(username: string, slug: string, body: {title: string}): Observable<{slug: string}> {
    return this.http.patch<{slug: string}>(`/user/${username}/folders/${slug}`, body)
  }

  public deleteFolder(username: string, slug: string): Observable<void> {
    return this.http.delete<void>(`/user/${username}/folders/${slug}`, { responseType: 'text' as 'json' })
  }

  public removeModule(slug: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiRoute}/${slug}/module/${id}`, { responseType: 'text' as 'json' })
  }
}
