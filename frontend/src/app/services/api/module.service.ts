import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Module } from '../../interfaces/quizCard.interface';

@Injectable({
  providedIn: 'root',
})

export class ModuleService {
  private apiRoute = '/module';

  constructor(private http: HttpClient) {}

  getModule(id: number): Observable<Module> {
    return this.http.get<Module>(`${this.apiRoute}/${id}`)
  }
}
