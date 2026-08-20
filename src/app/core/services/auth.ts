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

  /**
   * Inscription d'un transporteur : 3 étapes chaînées.
   *  1. POST /register        → crée le compte utilisateur (token + id)
   *  2. POST /transporteurs   → crée l'entité transporteur (profil vide au départ)
   *  3. PATCH /users/:id      → relie le compte à son transporteur (transporteurId)
   * La session finale porte le transporteurId, indispensable à l'espace transporteur.
   */
  registerTransporteur(payload: {
    email: string; password: string; nom: string; telephone: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API}/register`, { ...payload, role: 'transporteur' as const })
      .pipe(
        tap(res => this.storeSession(res)), // session avec le token (nécessaire pour les écritures protégées)
        switchMap(res => {
          const nouveauTransporteur = {
            nom: payload.nom,
            telephone: payload.telephone,