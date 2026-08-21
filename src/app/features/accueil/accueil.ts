import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Trajets } from '../../core/services/trajets';
import { Transporteurs } from '../../core/services/transporteurs';
import { Transporteur } from '../../models/transporteur.model';
import { Trajet, capaciteRestante, estComplet } from '../../models/trajet.model';
import { PATHS } from '../../app.paths';
import { MontantDevisePipe } from '../../shared/pipes/montant-devise-pipe';

@Component({
  selector: 'app-accueil',
  imports: [ReactiveFormsModule, RouterLink, MontantDevisePipe],
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
  readonly gpVedette = signal<Transporteur[]>([]);

  /** PORTAIL (E9+) : tous les trajets, pour la section "Prochains départs" */
  readonly tousLesTrajets = signal<Trajet[]>([]);
  readonly capaciteRestante = capaciteRestante;

  /** Trajets ouverts à venir, triés par date de départ (consultation libre) */
  readonly prochainsDeparts = computed(() =>
    this.tousLesTrajets()
      .filter(t => !estComplet(t))
      .sort((a, b) => a.dateDepart.localeCompare(b.dateDepart))
      .slice(0, 8)
  );

  readonly recherche = this.#fb.nonNullable.group({
    destination: [''],
    prixKiloMax: [null as number | null],
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
        this.gpVedette.set(
          [...transporteurs].sort((a, b) => b.note - a.note).slice(0, 4)
        );
        this.tousLesTrajets.set(trajets);
        this.statsChargees.set(true);
      },
      error: () => this.statsChargees.set(false),
    });
  }

  rechercher(): void {
    const { destination, prixKiloMax } = this.recherche.getRawValue();
    this.#router.navigate(['/' + PATHS.trajets], {
      queryParams: {
        destination: destination.trim() || null,
        prixKiloMax: prixKiloMax ?? null,
      },
    });
  }
}
