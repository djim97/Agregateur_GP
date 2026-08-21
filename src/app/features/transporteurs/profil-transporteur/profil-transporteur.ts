import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transporteurs } from '../../../core/services/transporteurs';
import { Trajets } from '../../../core/services/trajets';
import { AvisService } from '../../../core/services/avis';
import { Transporteur } from '../../../models/transporteur.model';
import { Trajet, estComplet, capaciteRestante } from '../../../models/trajet.model';
import { Avis, moyenneAvis } from '../../../models/avis.model';
import { PATHS } from '../../../app.paths';
import { MontantDevisePipe } from '../../../shared/pipes/montant-devise-pipe';

@Component({
  selector: 'app-profil-transporteur',
  imports: [RouterLink, MontantDevisePipe],
  templateUrl: './profil-transporteur.html',
  styleUrl: './profil-transporteur.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilTransporteur {
  readonly #route = inject(ActivatedRoute);
  readonly #transporteurs = inject(Transporteurs);
  readonly #trajets = inject(Trajets);
  readonly #avis = inject(AvisService);

  readonly paths = PATHS;
  readonly transporteur = signal<Transporteur | null>(null);
  readonly trajets = signal<Trajet[]>([]);
  readonly avis = signal<Avis[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly capaciteRestante = capaciteRestante;
  readonly etoiles = [1, 2, 3, 4, 5];

  /** Note calculée depuis les vrais avis ; à défaut, la note de la fiche */
  readonly noteAffichee = computed(() => {
    const liste = this.avis();
    return liste.length > 0 ? moyenneAvis(liste) : (this.transporteur()?.note ?? 0);
  });

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
      avis: this.#avis.getByTransporteur(id).pipe(catchError(() => of([] as Avis[]))),
    }).subscribe({
      next: result => {
        this.transporteur.set(result.transporteur);
        this.trajets.set(result.trajets.filter(t => !estComplet(t)));
        this.avis.set(result.avis);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
