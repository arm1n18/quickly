import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Module, UserModules } from '../../interfaces/quizCard.interface';

@Injectable({
  providedIn: 'root',
})

export class ModuleService {
  private apiRoute = '/module';

  constructor(private http: HttpClient) {}

  public getModule(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.apiRoute}/${id}`)
  }

  public getUserModules(username: string, name?: string, lastId?: number): Observable<UserModules> {
    const p = new URLSearchParams();
    if(name) p.append("name", name)
    if(lastId) p.append("lastId", String(lastId))

    const query = p.toString() ? `?${p.toString()}` : '';
    
    return this.http.get<UserModules>(`${this.apiRoute}/user/${username}${query}`)
  }
}
