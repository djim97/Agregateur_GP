import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transporteur } from '../../models/transporteur.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class Transporteurs {
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<Transporteur[]>(`${API}/transporteurs`);
  }

  getById(id: string) {
    return this.http.get<Transporteur>(`${API}/transporteurs/${id}`);
  }

  search(q: string) {
    return this.http.get<Transporteur[]>(`${API}/transporteurs`, {
      params: { q },
    });
  }
}