import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RendezVous } from '../../models/rendezvous.model';

const API = 'http://localhost:3000';

export interface NouveauRendezVous {
  commandeId: string;
  date: string;
  lieu: string;
}

@Injectable({ providedIn: 'root' })
export class Rendezvous {
  readonly #http = inject(HttpClient);

  creer(rdv: NouveauRendezVous): Observable<RendezVous> {
    const payload = { ...rdv, statut: 'EN_ATTENTE' as const };
    return this.#http.post<RendezVous>(`${API}/rendezvous`, payload);
  }

  update(id: string, patch: Partial<RendezVous>): Observable<RendezVous> {
    return this.#http.patch<RendezVous>(`${API}/rendezvous/${id}`, patch);
  }
}