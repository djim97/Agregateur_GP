import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  /** ÉVOLUTION FRET (E6) : mise à jour partielle (ex. produitsIllicites) */
  update(id: string, patch: Partial<Transporteur>): Observable<Transporteur> {
    return this.http.patch<Transporteur>(`${API}/transporteurs/${id}`, patch);
  }
}
