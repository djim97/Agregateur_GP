import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, Role, User } from '../../models/user.model';

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

  register(payload: { email: string; password: string; nom: string; role: Role }) {
    return this.http
      .post<AuthResponse>(`${API}/register`, payload)
      .pipe(tap(res => this.storeSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.#currentUser.set(null);
    this.router.navigate(['/login']);
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
    return { ...user, id: String(user.id) };  // normalise aussi les sessions déjà stockées
  }
}