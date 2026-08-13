import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Trajets, CriteresRecherche } from '../../../core/services/trajets';
import { Trajet } from '../../../models/trajet.model';
import { PATHS } from '../../../app.paths';

/** Les 3 états d'interface du wireframe W-03 + l'état d'erreur */
type EtatListe = 'chargement' | 'resultats' | 'vide' | 'erreur';

@Component({
  selector: 'app-liste-trajets',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './liste-trajets.html',
  styleUrl: './liste-trajets.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeTrajets {
  readonly #trajetsService = inject(Trajets);
  readonly #fb = inject(FormBuilder);

  // ---- État (signaux) ----
  readonly trajets = signal<Trajet[]>([]);
  readonly etat = signal<EtatListe>('chargement');
  readonly page = signal(1);
  readonly LIMITE = 5;
  /** true s'il existe probablement une page suivante (page pleine) */
  readonly aPageSuivante = signal(false);

  readonly trajetDetail = PATHS.trajetDetail;

  // ---- Formulaire de filtres ----
  readonly filtres = this.#fb.nonNullable.group({
    destination: [''],
    prixMax: [null as number | null],
    tri: ['dateDepart' as 'prix' | 'dateDepart'],
  });

  constructor() {
    this.rechercher(); // chargement initial
  }

  /** Soumission du formulaire : on repart page 1 */
  rechercher(): void {
    this.page.set(1);
    this.charger();
  }

  reinitialiser(): void {
    this.filtres.reset();
    this.rechercher();
  }

  pageSuivante(): void {
    this.page.update(p => p + 1);
    this.charger();
  }

  pagePrecedente(): void {
    this.page.update(p => Math.max(1, p - 1));
    this.charger();
  }

  private charger(): void {
    this.etat.set('chargement');

    const { destination, prixMax, tri } = this.filtres.getRawValue();
    const criteres: CriteresRecherche = {
      destination: destination || undefined,
      prixMax: prixMax ?? undefined,
      tri,
      ordre: 'asc',
      page: this.page(),
      limite: this.LIMITE,
    };

    this.#trajetsService.search(criteres).subscribe({
      next: trajets => {
        this.trajets.set(trajets);
        this.aPageSuivante.set(trajets.length === this.LIMITE);
        this.etat.set(trajets.length === 0 ? 'vide' : 'resultats');
      },
      error: () => this.etat.set('erreur'),
    });
  }
}