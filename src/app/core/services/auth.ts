import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map, Observable } from 'rxjs';
import { AuthResponse, Role, User } from '../../models/user.model';
import { TypeTransporteur, ModeTransport } from '../../models/transporteur.model';
import { PATHS } from '../../app.paths';

const API = 'http://localhost:3000';
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class Auth {
  readonly #currentUser = signal<User | null>(this.restoreUser());

  readonly currentUser = this.#currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.#currentUser() !== null);
  readonly role = computed<Role | null>(() => this.#currentUser()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${API}/login`, { email, password })
      .pipe(tap(res => this.storeSession(res)));
  }

  register(payload: { email: string; password: string; nom: string; telephone: string; role: Role }) {
    return this.http
      .post<AuthResponse>(`${API}/register`, payload)
      .pipe(tap(res => this.storeSession(res)));
  }

  /**
   * Inscription transporteur : compte + entité + lien (3 étapes chaînées).
   * Coordonnées exhaustives : email (repris du compte), adresse,
   * NINEA et service client pour les PROFESSIONNELS.
   */
  registerTransporteur(payload: {
    email: string; password: string; nom: string; telephone: string;
    type: TypeTransporteur;
    modesTransport: ModeTransport[];
    adresse: string;
    ninea?: string;
    serviceClient?: string;
  }): Observable<AuthResponse> {
    const modes: ModeTransport[] =
      payload.type === 'INFORMEL' ? ['ROUTE'] : payload.modesTransport;

    return this.http
      .post<AuthResponse>(`${API}/register`, {
        email: payload.email, password: payload.password,
        nom: payload.nom, telephone: payload.telephone,
        role: 'transporteur' as const,
      })
      .pipe(
        tap(res => this.storeSession(res)),
        switchMap(res => {
          const nouveauTransporteur = {
            nom: payload.nom,
            telephone: payload.telephone,
            zonesDesservies: [] as string[],
            note: 0,
            type: payload.type,
            modesTransport: modes,
            produitsIllicites: [] as string[],
            email: payload.email,
            adresse: payload.adresse,
            deviseReference: 'XOF' as const,
            ...(payload.type === 'PROFESSIONNEL' && payload.ninea ? { ninea: payload.ninea } : {}),
            ...(payload.type === 'PROFESSIONNEL' && payload.serviceClient ? { serviceClient: payload.serviceClient } : {}),
          };
          return this.http.post<{ id: string }>(`${API}/transporteurs`, nouveauTransporteur).pipe(
            switchMap(transporteur =>
              this.http
                .patch<User>(`${API}/users/${res.user.id}`, { transporteurId: String(transporteur.id) })
                .pipe(
                  map(() => {
                    const complet: AuthResponse = {
                      accessToken: res.accessToken,
                      user: { ...res.user, transporteurId: String(transporteur.id) },
                    };
                    this.storeSession(complet);
                    return complet;
                  })
                )
            )
          );
        })
      );
  }

  /**
   * Met à jour la session en mémoire ET dans le localStorage après
   * une modification de profil (le nom affiché dans la barre suit aussitôt).
   */
  mettreAJourSession(patch: Partial<User>): void {
    const actuel = this.#currentUser();
    if (!actuel) return;
    const maj: User = { ...actuel, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(maj));
    this.#currentUser.set(maj);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.#currentUser.set(null);
    this.router.navigate(['/' + PATHS.login]);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeSession(res: AuthResponse): void {
    const user: User = { ...res.user, id: String(res.user.id) };
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.#currentUser.set(user);
  }

  private restoreUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    return { ...user, id: String(user.id) };
  }
}