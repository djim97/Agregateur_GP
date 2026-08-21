import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Avis } from '../../models/avis.model';
import { Trajet } from '../../models/trajet.model';
import { Commande } from '../../models/commande.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AvisService {
  readonly #http = inject(HttpClient);

  getByClient(clientId: string): Observable<Avis[]> {
    return this.#http.get<Avis[]>(`${API}/reviews`, { params: { clientId } });
  }

  /** Avis reçus par un transporteur (alimente son écran et son profil public) */
  getByTransporteur(transporteurId: string): Observable<Avis[]> {
    return this.#http.get<Avis[]>(`${API}/reviews`, {
      params: { transporteurId, _sort: 'date', _order: 'desc' },
    });
  }

  /**
   * Création d'un avis : le transporteurId est résolu depuis la commande
   * (commande -> trajet -> transporteurId) puis stocké sur l'avis.
   * Cette dénormalisation évite de recroiser trajets et commandes
   * à chaque affichage côté transporteur ou sur le profil public.
   */
  creer(avis: Omit<Avis, 'id' | 'transporteurId'>): Observable<Avis> {
    return this.#http.get<Commande>(`${API}/commandes/${avis.commandeId}`).pipe(
      switchMap(commande => this.#http.get<Trajet>(`${API}/trajets/${commande.trajetId}`)),
      switchMap(trajet =>
        this.#http.post<Avis>(`${API}/reviews`, {
          ...avis,
          transporteurId: String(trajet.transporteurId),
        })
      )
    );
  }
}
