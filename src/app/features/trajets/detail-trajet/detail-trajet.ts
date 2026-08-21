import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Trajets } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet, capaciteRestante, estComplet } from '../../../models/trajet.model';
import { PATHS, QUERY } from '../../../app.paths';
import { MontantDevisePipe } from '../../../shared/pipes/montant-devise-pipe';

type EtatFiche = 'chargement' | 'ok' | 'introuvable';

@Component({
  selector: 'app-detail-trajet',
  imports: [RouterLink, MontantDevisePipe],
  templateUrl: './detail-trajet.html',
  styleUrl: './detail-trajet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailTrajet {
  readonly #trajetsService = inject(Trajets);
  readonly #auth = inject(Auth);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly etat = signal<EtatFiche>('chargement');
  readonly trajet = signal<Trajet | null>(null);
  readonly trajetsPath = '/' + PATHS.trajets;
  readonly capaciteRestante = capaciteRestante;
  readonly estComplet = estComplet;

  constructor() {
    const id = this.#route.snapshot.paramMap.get('id');
    if (!id) {
      this.etat.set('introuvable');
      return;
    }
    this.#trajetsService.getById(id).subscribe({
      next: t => {
        this.trajet.set(t);
        this.etat.set('ok');
      },
      error: () => this.etat.set('introuvable'),
    });
  }

  commander(): void {
    const t = this.trajet();
    if (!t || estComplet(t)) return;

    const cible = `/${PATHS.nouvelleCommande}?${QUERY.trajetId}=${t.id}`;
    if (this.#auth.isLoggedIn()) {
      this.#router.navigateByUrl(cible);
    } else {
      this.#router.navigate(['/' + PATHS.login], {
        queryParams: { [QUERY.returnUrl]: cible },
      });
    }
  }
}
