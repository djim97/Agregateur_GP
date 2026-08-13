import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trajet } from '../../models/trajet.model';

const API = 'http://localhost:3000';

export interface CriteresRecherche {
  destination?: string;
  prixMax?: number;
  tri?: 'prix' | 'dateDepart';
  ordre?: 'asc' | 'desc';
  page?: number;
  limite?: number;
}

@Injectable({ providedIn: 'root' })
export class Trajets {
  constructor(private http: HttpClient) {}

  search(criteres: CriteresRecherche): Observable<Trajet[]> {
    let params = new HttpParams()
      .set('_page', criteres.page ?? 1)
      .set('_limit', criteres.limite ?? 10)
      .set('_sort', criteres.tri ?? 'dateDepart')
      .set('_order', criteres.ordre ?? 'asc');

    if (criteres.destination?.trim()) {
      params = params.set('destination', criteres.destination.trim());
    }
    if (criteres.prixMax != null) {
      params = params.set('prix_lte', criteres.prixMax);
    }

    return this.http.get<Trajet[]>(`${API}/trajets`, { params });
  }

  getById(id: string): Observable<Trajet> {
    return this.http.get<Trajet>(`${API}/trajets/${id}`, {
      params: new HttpParams().set('_expand', 'transporteur'),
    });
  }
}