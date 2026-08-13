import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'erreur' | 'info';
}

@Injectable({ providedIn: 'root' })
export class Notifications {
  readonly #toasts = signal<Toast[]>([]);
  readonly toasts = this.#toasts.asReadonly();
  #compteur = 0;

  erreur(message: string): void {
    this.ajouter(message, 'erreur');
  }

  info(message: string): void {
    this.ajouter(message, 'info');
  }

  fermer(id: number): void {
    this.#toasts.update(liste => liste.filter(t => t.id !== id));
  }

  private ajouter(message: string, type: Toast['type']): void {
    const toast: Toast = { id: ++this.#compteur, message, type };
    this.#toasts.update(liste => [...liste, toast]);
    setTimeout(() => this.fermer(toast.id), 5000); // auto-fermeture
  }
}