import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Avis } from '../../models/avis.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AvisService {
  readonly #http = inject(HttpClient);

  getByClient(clientId: string) {
    return this.#http.get<Avis[]>(`${API}/reviews`, { params: { clientId } });
  }

  creer(avis: Omit<Avis, 'id'>) {
    return this.#http.post<Avis>(`${API}/reviews`, avis);
  }
}
