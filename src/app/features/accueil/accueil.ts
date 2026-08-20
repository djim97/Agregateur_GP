import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Trajets } from '../../core/services/trajets';
import { Transporteurs } from '../../core/services/transporteurs';
import { PATHS, QUERY } from '../../app.paths';

@Component({
  selector: 'app-accueil',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Accueil {
  readonly #fb = inject(FormBuilder);
  readonly #router = inject(Router);
  readonly #trajets = inject(Trajets);
  readonly #transporteurs = inject(Transporteurs);

  readonly paths = PATHS;
  readonly stats = signal({ trajets: 0, transporteurs: 0, destinations: 0 });
  readonly statsChargees = signal(false);

  readonly recherche = this.#fb.nonNullable.group({
    destination: [''],
    prixMax: [null as number | null],
  });

  constructor() {
    forkJoin({
      trajets: this.#trajets.search({ limite: 100 }),
      transporteurs: this.#transporteurs.getAll(),
    }).subscribe({
      next: ({ trajets, transporteurs }) => {
        this.stats.set({
          trajets: trajets.length,
          transporteurs: transporteurs.length,
          destinations: new Set(trajets.map(trajet => trajet.destination)).size,
        });
        this.statsChargees.set(true);
      },
      error: () => this.statsChargees.set(false),
    });
  }

  rechercher(): void {
    const { destination, prixMax } = this.recherche.getRawValue();
    this.#router.navigate(['/' + PATHS.trajets], {
      queryParams: {
        destination: destination.trim() || null,
        prixMax: prixMax ?? null,
      },
    });
  }
}
