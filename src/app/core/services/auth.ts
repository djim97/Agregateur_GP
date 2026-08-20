import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, map, Observable } from 'rxjs';
import { AuthResponse, Role, User } from '../../models/user.model';
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

  registerTransporteur(payload: {
    email: string; password: string; nom: string; telephone: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/register`, { ...payload, role: 'transporteur' as const })
      .pipe(
        tap(res => this.storeSession(res)),
        switchMap(res => {
          const nouveauTransporteur = {
            nom: payload.nom,
            telephone: payload.telephone,
            zonesDesservies: [] as string[],
            note: 0,
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