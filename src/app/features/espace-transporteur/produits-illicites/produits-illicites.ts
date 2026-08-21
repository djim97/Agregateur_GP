import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Transporteurs } from '../../../core/services/transporteurs';
import { Auth } from '../../../core/services/auth';
import { Notifications } from '../../../core/services/notifications';
import { CATEGORIES_PRODUITS, LISTE_GLOBALE_ILLICITE } from '../../../models/produits';
import { Spinner } from '../../../shared/components/spinner/spinner';

/**
 * ÉVOLUTION FRET (E6) : gestion de la liste individuelle de produits refusés.
 * La liste GLOBALE (armes, drogues...) est affichée en lecture seule :
 * elle s'applique à tous et n'est pas contournable (décision 6).
 */
@Component({
  selector: 'app-produits-illicites',
  imports: [Spinner],
  templateUrl: './produits-illicites.html',
  styleUrl: './produits-illicites.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitsIllicites implements OnInit {
  private transporteursService = inject(Transporteurs);
  private auth = inject(Auth);
  private notifications = inject(Notifications);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enEnvoi = signal(false);
  protected readonly refuses = signal<string[]>([]);

  protected readonly categories = CATEGORIES_PRODUITS;
  protected readonly listeGlobale = LISTE_GLOBALE_ILLICITE;

  #transporteurId: string | null = null;

  ngOnInit(): void {
    this.#transporteurId = this.auth.currentUser()?.transporteurId ?? null;
    if (!this.#transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      this.isLoading.set(false);
      return;
    }
    this.transporteursService.getById(this.#transporteurId).subscribe({
      next: t => {
        this.refuses.set(t.produitsIllicites ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger vos préférences.');
        this.isLoading.set(false);
      },
    });
  }

  protected estRefuse(categorie: string): boolean {
    return this.refuses().includes(categorie);
  }

  /** Bascule une catégorie et enregistre immédiatement (PATCH). */
  protected basculer(categorie: string): void {
    if (!this.#transporteurId || this.enEnvoi()) return;

    const avant = this.refuses();
    const apres = avant.includes(categorie)
      ? avant.filter(c => c !== categorie)
      : [...avant, categorie];

    this.refuses.set(apres);       // optimiste
    this.enEnvoi.set(true);

    this.transporteursService.update(this.#transporteurId, { produitsIllicites: apres }).subscribe({
      next: () => {
        this.enEnvoi.set(false);
        this.notifications.info('Préférences enregistrées.');
      },
      error: () => {
        this.refuses.set(avant);   // rollback si échec
        this.enEnvoi.set(false);
        this.notifications.info("L'enregistrement a échoué.");
      },
    });
  }
}
