import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Transporteurs } from '../../../core/services/transporteurs';
import { Trajets } from '../../../core/services/trajets';
import { Transporteur } from '../../../models/transporteur.model';
import { Trajet, estComplet, capaciteRestante } from '../../../models/trajet.model';
import { PATHS } from '../../../app.paths';

@Component({
  selector: 'app-profil-transporteur',
  imports: [RouterLink],
  templateUrl: './profil-transporteur.html',
  styleUrl: './profil-transporteur.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilTransporteur {
  readonly #route = inject(ActivatedRoute);
  readonly #transporteurs = inject(Transporteurs);
  readonly #trajets = inject(Trajets);

  readonly paths = PATHS;
  readonly transporteur = signal<Transporteur | null>(null);
  readonly trajets = signal<Trajet[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly capaciteRestante = capaciteRestante;

  constructor() {
    const id = this.#route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set(true);
      return;
    }
    forkJoin({
      transporteur: this.#transporteurs.getById(id),
      trajets: this.#trajets.getByTransporteur(id),
    }).subscribe({
      next: result => {
        this.transporteur.set(result.transporteur);
        // Trajets encore ouverts : ni complets, ni sans capacité restante
        this.trajets.set(result.trajets.filter(t => !estComplet(t)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
