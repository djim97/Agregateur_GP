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
  /** Valeurs affichees, animees de 0 jusqu'au total (compteur) */
  readonly compteurs = signal({ trajets: 0, transporteurs: 0, destinations: 0 });
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
        this.lancerCompteurs();
      },
      error: () => this.statsChargees.set(false),
    });
  }

  /**
   * Fait defiler les chiffres de 0 jusqu'a leur valeur, en 1,1 s.
   * Courbe d'attenuation pour ralentir a l'approche du total.
   * L'animation est ignoree si la personne a demande a reduire les mouvements.
   */
  private lancerCompteurs(): void {
    const cible = this.stats();

    const reduit = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduit) {
      this.compteurs.set(cible);
      return;
    }

    const DUREE = 1100;
    const debut = performance.now();

    const avancer = (maintenant: number) => {
      const progression = Math.min(1, (maintenant - debut) / DUREE);
      const attenue = 1 - Math.pow(1 - progression, 3);   // ease-out cubique
      this.compteurs.set({
        trajets: Math.round(cible.trajets * attenue),
        transporteurs: Math.round(cible.transporteurs * attenue),
        destinations: Math.round(cible.destinations * attenue),
      });
      if (progression < 1) {
        requestAnimationFrame(avancer);
      } else {
        this.compteurs.set(cible);   // valeur exacte a l'arrivee
      }
    };

    requestAnimationFrame(avancer);
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
