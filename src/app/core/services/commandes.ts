import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, throwError, map } from 'rxjs';
import { Commande } from '../../models/commande.model';
import { Trajet } from '../../models/trajet.model';

const API = 'http://localhost:3000';

/** Erreur métier : plus de place au moment de la commande */
export class PlusDePlacesError extends Error {
  constructor() {
    super('Plus aucune place disponible sur ce trajet');
  }
}

export interface NouvelleCommande {
  clientId: string;
  trajetId: string;
  poids: number;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class Commandes {
  readonly #http = inject(HttpClient);

  /**
   * Création d'une commande en 3 étapes chaînées (switchMap) :
   *  1. GET frais du trajet : re-vérifier les places (limite la course entre 2 clients)
   *  2. POST /commandes
   *  3. PATCH /trajets/:id : décrément de placesDisponibles
   * JSON Server n'offre pas de transaction : si le PATCH échouait après le POST,
   * la commande existerait sans décrément (limite assumée, documentée au rapport 6.2).
   */
  creer(nouvelle: NouvelleCommande): Observable<Commande> {
    return this.#http.get<Trajet>(`${API}/trajets/${nouvelle.trajetId}`).pipe(
      switchMap(trajet => {
        if (trajet.placesDisponibles <= 0) {
          return throwError(() => new PlusDePlacesError());
        }
        const commande = {
          ...nouvelle,
          statut: 'EN_ATTENTE' as const,
          dateCommande: new Date().toISOString().slice(0, 10),
        };
        return this.#http.post<Commande>(`${API}/commandes`, commande).pipe(
          switchMap(creee =>
            this.#http
              .patch<Trajet>(`${API}/trajets/${trajet.id}`, {
                placesDisponibles: trajet.placesDisponibles - 1,
              })
              .pipe(map(() => creee))
          )
        );
      })
    );
  }

  // B3 — commandes d'un client 
  getByClient(clientId: string): Observable<Commande[]> {
    return this.#http.get<Commande[]>(`${API}/commandes`, {
      params: { clientId },
    });
  }
}