import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Trajets } from '../../../core/services/trajets';
import { Commandes, ColisRefuseError } from '../../../core/services/commandes';
import { Auth } from '../../../core/services/auth';
import { Trajet, capaciteRestante, estComplet } from '../../../models/trajet.model';
import { Commande } from '../../../models/commande.model';
import {
  CATEGORIES_PRODUITS, NiveauFragilite,
  poidsFacture, poidsVolumetrique, estVolumineux,
} from '../../../models/produits';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';
import { Notifications } from '../../../core/services/notifications';

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
  readonly #notifications = inject(Notifications);

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
  /** queryParams construits via le contrat QUERY (les clés calculées sont interdites dans les templates) */
  readonly rdvQueryParams = (id: string) => ({ [QUERY.commandeId]: id });
  readonly categories = CATEGORIES_PRODUITS;
  readonly capaciteRestante = capaciteRestante;

  // ÉVOLUTION FRET : poids + dimensions + fragilité + catégorie
  readonly form = this.#fb.nonNullable.group({
    poids: [null as number | null, [Validators.required, Validators.min(0.1), Validators.max(1000)]],
    L: [null as number | null, [Validators.required, Validators.min(1)]],
    l: [null as number | null, [Validators.required, Validators.min(1)]],
    h: [null as number | null, [Validators.required, Validators.min(1)]],
    niveauFragilite: ['AUCUNE' as NiveauFragilite, Validators.required],
    categorieProduit: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  // Valeurs du formulaire sous forme de signal (recalcul du prix en direct)
  readonly #valeurs = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** Poids volumétrique en direct (kg, 2 décimales) */
  readonly poidsVol = computed(() => {
    const v = this.#valeurs();
    if (!v?.L || !v?.l || !v?.h) return null;
    return Math.round(poidsVolumetrique({ L: v.L, l: v.l, h: v.h }) * 100) / 100;
  });

  /** Poids facturé = max(réel, volumétrique) */
  readonly poidsFact = computed(() => {
    const v = this.#valeurs();
    if (!v?.poids || !v?.L || !v?.l || !v?.h) return null;
    return Math.round(poidsFacture(v.poids, { L: v.L, l: v.l, h: v.h }) * 100) / 100;
  });

  /** Prix estimé = poidsFacturé x prixParKilo */
  readonly prixEstime = computed(() => {
    const t = this.trajet();
    const pf = this.poidsFact();
    if (!t || pf == null) return null;
    return Math.round(pf * t.prixParKilo);
  });

  /** Colis volumineux (L+l+h > 150) : information affichée */
  readonly volumineux = computed(() => {
    const v = this.#valeurs();
    if (!v?.L || !v?.l || !v?.h) return false;
    return estVolumineux({ L: v.L, l: v.l, h: v.h });
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
        this.etat.set(estComplet(t) ? 'introuvable' : 'formulaire');
      },
      error: () => this.etat.set('introuvable'),
    });
  }

  submit(): void {
    const trajet = this.trajet();
    const user = this.#auth.currentUser();
    if (this.form.invalid || !trajet || !user || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);
    const v = this.form.getRawValue();

    this.#commandesService.creer({
      clientId: user.id,
      trajetId: trajet.id,
      description: v.description,
      poids: v.poids!,
      dimensions: { L: v.L!, l: v.l!, h: v.h! },
      niveauFragilite: v.niveauFragilite,
      categorieProduit: v.categorieProduit,
    }).subscribe({
      next: commande => {
        this.commandeCreee.set(commande);
        this.etat.set('confirmation');
        this.#notifications.info('Commande créée. Pensez à prendre rendez-vous pour le dépôt.');
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMsg.set(
          err instanceof ColisRefuseError
            ? err.motifMessage
            : 'La commande a échoué, réessayez.'
        );
      },
    });
  }
}
