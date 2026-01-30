import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Module, ModulesSummary, UserModulesResponse } from '../../interfaces/quizCard.interface';

@Injectable({
  providedIn: 'root',
})

export class ModuleService {
  private apiRoute = '/module';

  constructor(private http: HttpClient) {}

  public getModule(id: number): Observable<{module: Module}> {
    return this.http.get<{module: Module}>(`${this.apiRoute}/${id}`)
  }

  public getModuleByName(name: string): Observable<ModulesSummary> {
    return this.http.get<ModulesSummary>(`${this.apiRoute}/search?name=${name}`)
  }

  public getUserModules(username: string, name?: string, lastId?: number): Observable<UserModulesResponse> {
    const p = new URLSearchParams();
    if(name) p.append("name", name)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<UserModulesResponse>(`${this.apiRoute}/user/${username}${query}`)
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
}
