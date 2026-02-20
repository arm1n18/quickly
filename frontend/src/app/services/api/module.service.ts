import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Module, ModulesSummary } from '../../interfaces/module.interface';
import { Keyword } from '../../components/ui/keywords-input/keywords-input.component';

@Injectable({
  providedIn: 'root',
})

export class ModuleService {
  private apiRoute = '/modules';

  constructor(private http: HttpClient) {}

  public getModule(id: number): Observable<{module: Module}> {
    return this.http.get<{module: Module}>(`${this.apiRoute}/${id}`)
  }

  public getModules(title?: string, keywords?: string[], limit?: string, lastId?: number): Observable<ModulesSummary> {
    const p = new URLSearchParams();
    if(title) p.append("title", title)
    if(limit) p.append("limit", limit)
    if(keywords) p.append("keywords", keywords.join(','))
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';

    return this.http.get<ModulesSummary>(`${this.apiRoute}/search${query}`)
  }

  public getUserModules(username: string, title?: string, lastId?: number): Observable<ModulesSummary> {
    const p = new URLSearchParams();
    if(title) p.append("title", title)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<ModulesSummary>(`${this.apiRoute}/user/${username}${query}`)
  }

  public getUserSavedModules(title?: string, lastId?: number): Observable<ModulesSummary> {
    const p = new URLSearchParams();
    if(title) p.append("title", title)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<ModulesSummary>(`${this.apiRoute}/saved${query}`)
  }

  public postModule(module: any): Observable<{id: number}> {
    return this.http.post<{id: number}>(`${this.apiRoute}`, module)
  }

  public putModule(id: number, module: any): Observable<void> {
    return this.http.put<void>(`${this.apiRoute}/${id}`, module, { responseType: 'text' as 'json' })
  }

  public patchModule(id: number, card: any): Observable<void> {
    return this.http.patch<void>(`${this.apiRoute}/${id}`, card, { responseType: 'text' as 'json' })
  }

  public deleteModule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiRoute}/${id}`, { responseType: 'text' as 'json' })
  }

  public saveModule(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiRoute}/${id}/save`, null, { responseType: 'text' as 'json' })
  }

  public unsaveModule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiRoute}/${id}/save`, { responseType: 'text' as 'json' })
  }

  public findKeywords(title?: string): Observable<{keywords: Keyword[]}> {
    const p = new URLSearchParams();
    if(title) p.append("title", title)

    const query = p.toString() ? `?${p.toString()}` : '';

    return this.http.get<{keywords: Keyword[]}>(`${this.apiRoute}/keywords${query}`)
  }

  public getKeywordsBySlug(keywords: string[]): Observable<{keywords: Keyword[]}> {
    return this.http.get<{keywords: Keyword[]}>(`${this.apiRoute}/keywords/${keywords.join(',')}`)
  }
}
