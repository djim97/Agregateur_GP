import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trajet } from '../../models/trajet.model';
import { CodeDevise } from '../../models/devises';

const API = 'http://localhost:3000';

export interface CriteresRecherche {
  destination?: string;
  prixKiloMax?: number;          // remplace prixMax : filtre sur le tarif au kilo
  tri?: 'prixParKilo' | 'dateDepart';
  ordre?: 'asc' | 'desc';
  page?: number;
  limite?: number;
}

/** Payload de création/édition d'un trajet (ÉVOLUTION FRET) */
export interface TrajetPayload {
  transporteurId: string;
  destination: string;
  dateDepart: string;
  prixParKilo: number;
  devise: CodeDevise;
  capaciteKilosTotale: number;
  plageReceptionDebut: string;
  plageReceptionFin: string;
}

@Injectable({ providedIn: 'root' })
export class Trajets {
  constructor(private http: HttpClient) {}

  search(criteres: CriteresRecherche): Observable<Trajet[]> {
    let params = new HttpParams()
      .set('_page', criteres.page ?? 1)
      .set('_limit', criteres.limite ?? 10)
      .set('_sort', criteres.tri ?? 'dateDepart')
      .set('_order', criteres.ordre ?? 'asc')
      .set('_expand', 'transporteur');   // le transporteur est requis pour la compatibilité

    if (criteres.destination?.trim()) {
      params = params.set('destination', criteres.destination.trim());
    }
    if (criteres.prixKiloMax != null) {
      // Attention : le filtre compare des nombres bruts, sans tenir compte
      // de la devise du trajet. Il n'a de sens qu'entre trajets facturés
      // dans la même devise (voir NOTES-EVOLUTIONS.md).
      params = params.set('prixParKilo_lte', criteres.prixKiloMax);
    }

    return this.http.get<Trajet[]>(`${API}/trajets`, { params });
  }

  getById(id: string): Observable<Trajet> {
    return this.http.get<Trajet>(`${API}/trajets/${id}`, {
      params: new HttpParams().set('_expand', 'transporteur'),
    });
  }

  getByTransporteur(transporteurId: string): Observable<Trajet[]> {
    return this.http.get<Trajet[]>(`${API}/trajets`, {
      params: new HttpParams().set('transporteurId', transporteurId),
    });
  }

  creer(p: TrajetPayload): Observable<Trajet> {
    return this.http.post<Trajet>(`${API}/trajets`, this.versTrajet(p));
  }

  modifier(id: string, p: TrajetPayload, kilosReserves: number, complet: boolean): Observable<Trajet> {
    // PUT complet : on préserve les kilos déjà réservés et l'état complet
    return this.http.put<Trajet>(`${API}/trajets/${id}`, {
      ...this.versTrajet(p),
      kilosReserves,
      complet,
    });
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/trajets/${id}`);
  }

  /** Marquer un trajet complet (manuellement ou par la règle automatique) */
  marquerComplet(id: string): Observable<Trajet> {
    return this.http.patch<Trajet>(`${API}/trajets/${id}`, { complet: true });
  }

  private versTrajet(p: TrajetPayload) {
    return {
      transporteurId: p.transporteurId,
      destination: p.destination,
      dateDepart: p.dateDepart,
      prixParKilo: p.prixParKilo,
      devise: p.devise,
      capaciteKilosTotale: p.capaciteKilosTotale,
      kilosReserves: 0,
      complet: false,
      plageReception: { debut: p.plageReceptionDebut, fin: p.plageReceptionFin },
    };
  }
}
