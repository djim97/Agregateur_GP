import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';
import { Avis, avisSurTransporteurs, avisSurClients } from '../../models/avis.model';
import { Trajet } from '../../models/trajet.model';
import { Commande } from '../../models/commande.model';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class AvisService {
  readonly #http = inject(HttpClient);

  /** Tous les avis, sans distinction de sens */
  getTous(): Observable<Avis[]> {
    return this.#http.get<Avis[]>(`${API}/reviews`);
  }

  // ---------- Avis DÉPOSÉS PAR un client (sur des transporteurs) ----------

  /** Avis écrits par ce client : sert à savoir ce qu'il a déjà noté */
  getEcritsParClient(clientId: string): Observable<Avis[]> {
    return this.#http
      .get<Avis[]>(`${API}/reviews`, { params: { clientId } })
      .pipe(map(avisSurTransporteurs));
  }

  /** Avis reçus par un transporteur (profil public, son écran) */
  getByTransporteur(transporteurId: string): Observable<Avis[]> {
    return this.#http
      .get<Avis[]>(`${API}/reviews`, { params: { transporteurId, _sort: 'date', _order: 'desc' } })
      .pipe(map(avisSurTransporteurs));
  }

  /**
   * Un client note un transporteur. Le transporteurId est résolu depuis
   * la commande (commande -> trajet) puis stocké sur l'avis.
   */
  creer(avis: Omit<Avis, 'id' | 'transporteurId' | 'cible'>): Observable<Avis> {
    return this.#http.get<Commande>(`${API}/commandes/${avis.commandeId}`).pipe(
      switchMap(commande => this.#http.get<Trajet>(`${API}/trajets/${commande.trajetId}`)),
      switchMap(trajet =>
        this.#http.post<Avis>(`${API}/reviews`, {
          ...avis,
          transporteurId: String(trajet.transporteurId),
          cible: 'TRANSPORTEUR' as const,
        })
      )
    );
  }

  // ---------- Avis DÉPOSÉS PAR un transporteur (sur des clients) ----------

  /** Avis reçus par un client, déposés par des transporteurs */
  getSurClient(clientId: string): Observable<Avis[]> {
    return this.#http
      .get<Avis[]>(`${API}/reviews`, { params: { clientId, _sort: 'date', _order: 'desc' } })
      .pipe(map(avisSurClients));
  }

  /** Avis écrits par ce transporteur sur ses clients */
  getEcritsParTransporteur(transporteurId: string): Observable<Avis[]> {
    return this.#http
      .get<Avis[]>(`${API}/reviews`, { params: { transporteurId } })
      .pipe(map(avisSurClients));
  }

  /** Un transporteur note le client d'une commande */
  creerSurClient(avis: {
    commandeId: string;
    clientId: string;
    transporteurId: string;
    note: number;
    commentaire: string;
  }): Observable<Avis> {
    return this.#http.post<Avis>(`${API}/reviews`, {
      ...avis,
      cible: 'CLIENT' as const,
      date: new Date().toISOString().slice(0, 10),
    });
  }
}
