import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { User } from '../../models/user.model';
import { Transporteur } from '../../models/transporteur.model';
import { Auth } from './auth';

const API = 'http://localhost:3000';

export interface MajCompte {
  nom: string;
  telephone: string;
  /** Optionnel : laissé vide, le mot de passe n'est pas touché */
  password?: string;
}

export interface MajTransporteur {
  email: string;
  adresse: string;
  serviceClient?: string;
  zonesDesservies: string[];
  /** Recopié depuis le compte pour garder les deux fiches cohérentes */
  telephone?: string;
}

@Injectable({ providedIn: 'root' })
export class Profil {
  readonly #http = inject(HttpClient);
  readonly #auth = inject(Auth);

  /** Compte utilisateur (nom, téléphone, éventuellement mot de passe) */
  majCompte(userId: string, maj: MajCompte): Observable<User> {
    const patch: Record<string, string> = {
      nom: maj.nom,
      telephone: maj.telephone,
    };
    if (maj.password) patch['password'] = maj.password;

    return this.#http.patch<User>(`${API}/users/${userId}`, patch).pipe(
      tap(() => this.rafraichirSessionLocale(maj.nom))
    );
  }

  /** Entité transporteur (coordonnées publiques) */
  majTransporteur(transporteurId: string, maj: MajTransporteur): Observable<Transporteur> {
    return this.#http.patch<Transporteur>(`${API}/transporteurs/${transporteurId}`, maj);
  }

  /** Compte + entité en une fois pour un transporteur */
  majProfilTransporteur(
    userId: string,
    transporteurId: string,
    compte: MajCompte,
    transporteur: MajTransporteur,
  ): Observable<Transporteur> {
    return this.majCompte(userId, compte).pipe(
      switchMap(() => this.majTransporteur(transporteurId, transporteur))
    );
  }

  getTransporteur(id: string): Observable<Transporteur> {
    return this.#http.get<Transporteur>(`${API}/transporteurs/${id}`);
  }

  /** Le nom affiché dans la barre suit immédiatement la modification. */
  private rafraichirSessionLocale(nom: string): void {
    this.#auth.mettreAJourSession({ nom });
  }
}
