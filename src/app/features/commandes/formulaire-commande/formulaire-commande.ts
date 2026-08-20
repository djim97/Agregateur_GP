import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Trajets } from '../../../core/services/trajets';
import { Commandes, PlusDePlacesError } from '../../../core/services/commandes';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';
import { Commande } from '../../../models/commande.model';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

type EtatPage = 'chargement' | 'formulaire' | 'confirmation' | 'introuvable';

@Component({
  selector: 'app-formulaire-commande',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulaire-commande.html',
  styleUrl: './formulaire-commande.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireCommande {
  readonly #trajetsService = inject(Trajets);
  readonly #commandesService = inject(Commandes);
  readonly #auth = inject(Auth);
  readonly #route = inject(ActivatedRoute);
  readonly #fb = inject(FormBuilder);

  readonly etat = signal<EtatPage>('chargement');
  readonly trajet = signal<Trajet | null>(null);
  readonly commandeCreee = signal<Commande | null>(null);
  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly mesCommandesPath = '/' + PATHS.mesCommandes;
  readonly trajetsPath = '/' + PATHS.trajets;
  readonly nouveauRdvPath = '/' + PATHS.nouveauRdv;
  readonly QUERY = QUERY;
  readonly numeroCommande = formatCommandeNumber;

  readonly form = this.#fb.nonNullable.group({
    poids: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(500)]],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  constructor() {
    const trajetId = this.#route.snapshot.queryParamMap.get(QUERY.trajetId);
    if (!trajetId) {
      this.etat.set('introuvable');
      return;
    }
    this.#trajetsService.getById(trajetId).subscribe({
      next: t => {
        this.trajet.set(t);
        this.etat.set(t.placesDisponibles > 0 ? 'formulaire' : 'introuvable');
      },
      error: () => this.etat.set('introuvable'),
    });
  }

  submit(): void {
    const trajet = this.trajet();
    const user = this.#auth.currentUser();
    if (this.form.invalid || this.isLoading() || !trajet || !user) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { poids, description } = this.form.getRawValue();
    this.#commandesService
      .creer({ clientId: user.id, trajetId: trajet.id, poids: poids!, description })
      .subscribe({
        next: commande => {
          this.commandeCreee.set(commande);
          this.etat.set('confirmation');
        },
        error: err => {
          this.errorMsg.set(
            err instanceof PlusDePlacesError
              ? 'Désolé, plus aucune place disponible sur ce trajet.'
              : 'La commande a échoué, veuillez réessayer.'
          );
          this.isLoading.set(false);
        },
      });
  }
}