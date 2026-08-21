import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, of } from 'rxjs';
import { Reclamation, StatutReclamation } from '../../models/reclamation.model';
import { Trajet } from '../../models/trajet.model';
import { Commande } from '../../models/commande.model';
import { maintenantISO } from '../../shared/utils/date-format';

const API = 'http://localhost:3000';

export interface NouvelleReclamation {
  clientId: string;
  commandeId?: string;
  motif: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class Reclamations {
  readonly #http = inject(HttpClient);

  getByClient(clientId: string): Observable<Reclamation[]> {
    return this.#http.get<Reclamation[]>(`${API}/reclamations`, {
      params: { clientId, _sort: 'dateCreation', _order: 'desc' },
    });
  }

  /** Réclamations adressées à un transporteur (niveau 1 : il répond lui-même) */
  getByTransporteur(transporteurId: string): Observable<Reclamation[]> {
    return this.#http.get<Reclamation[]>(`${API}/reclamations`, {
      params: { transporteurId, _sort: 'dateCreation', _order: 'desc' },
    });
  }

  /**
   * Création : si la réclamation porte sur une commande, on résout le
   * transporteur destinataire (commande -> trajet) pour la lui router.
   * Sans commande, la réclamation reste générale et sans destinataire.
   */
  creer(nouvelle: NouvelleReclamation): Observable<Reclamation> {
    const base = {
      ...nouvelle,
      statut: 'OUVERTE' as StatutReclamation,
      dateCreation: maintenantISO(),
    };

    if (!nouvelle.commandeId) {
      return this.#http.post<Reclamation>(`${API}/reclamations`, base);
    }

    return this.#http.get<Commande>(`${API}/commandes/${nouvelle.commandeId}`).pipe(
      switchMap(commande => this.#http.get<Trajet>(`${API}/trajets/${commande.trajetId}`)),
      switchMap(trajet =>
        this.#http.post<Reclamation>(`${API}/reclamations`, {
          ...base,
          transporteurId: String(trajet.transporteurId),
        })
      )
    );
  }

  /** Le transporteur prend en charge le dossier */
  prendreEnCharge(id: string): Observable<Reclamation> {
    return this.#http.patch<Reclamation>(`${API}/reclamations/${id}`, {
      statut: 'EN_TRAITEMENT' as StatutReclamation,
      datePriseEnCharge: maintenantISO(),
    });
  }

  /** Le transporteur répond et clôt le dossier */
  repondre(id: string, reponse: string): Observable<Reclamation> {
    return this.#http.patch<Reclamation>(`${API}/reclamations/${id}`, {
      statut: 'RESOLUE' as StatutReclamation,
      reponse,
      dateReponse: maintenantISO(),
    });
  }
}
