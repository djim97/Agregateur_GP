import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AvisService } from '../../../core/services/avis';
import { Reclamations } from '../../../core/services/reclamations';
import { Auth } from '../../../core/services/auth';
import { Notifications } from '../../../core/services/notifications';
import { Avis, moyenneAvis } from '../../../models/avis.model';
import { Reclamation } from '../../../models/reclamation.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

type Onglet = 'avis' | 'reclamations';

/**
 * Écran transporteur : ce que disent les clients (avis) et les dossiers
 * de réclamation qui lui sont adressés (traitement de niveau 1 :
 * le transporteur prend en charge puis répond lui-même).
 */
@Component({
  selector: 'app-avis-reclamations',
  imports: [FormsModule, Spinner, EtatVide],
  templateUrl: './avis-reclamations.html',
  styleUrl: './avis-reclamations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisReclamations implements OnInit {
  readonly #avisService = inject(AvisService);
  readonly #reclamations = inject(Reclamations);
  readonly #auth = inject(Auth);
  readonly #notifications = inject(Notifications);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly onglet = signal<Onglet>('avis');
  protected readonly actionEnCours = signal<string | null>(null);

  protected readonly avis = signal<Avis[]>([]);
  protected readonly dossiers = signal<Reclamation[]>([]);

  /** Dossier ouvert dans le formulaire de réponse */
  protected readonly reponseOuverte = signal<string | null>(null);
  protected texteReponse = '';

  protected readonly numeroCommande = formatCommandeNumber;
  protected readonly etoiles = [1, 2, 3, 4, 5];

  protected readonly note = computed(() => moyenneAvis(this.avis()));
  protected readonly aTraiter = computed(() =>
    this.dossiers().filter(d => d.statut !== 'RESOLUE').length
  );

  ngOnInit(): void {
    const transporteurId = this.#auth.currentUser()?.transporteurId;
    if (!transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      avis: this.#avisService.getByTransporteur(transporteurId).pipe(catchError(() => of([] as Avis[]))),
      dossiers: this.#reclamations.getByTransporteur(transporteurId).pipe(catchError(() => of([] as Reclamation[]))),
    }).subscribe(({ avis, dossiers }) => {
      this.avis.set(avis);
      this.dossiers.set(dossiers);
      this.isLoading.set(false);
    });
  }

  protected changerOnglet(o: Onglet): void {
    this.onglet.set(o);
  }

  protected prendreEnCharge(d: Reclamation): void {
    this.actionEnCours.set(d.id);
    this.#reclamations.prendreEnCharge(d.id).subscribe({
      next: () => {
        this.majDossier(d.id, { statut: 'EN_TRAITEMENT' });
        this.#notifications.info('Dossier pris en charge.');
        this.actionEnCours.set(null);
      },
      error: () => this.actionEnCours.set(null),
    });
  }

  protected ouvrirReponse(d: Reclamation): void {
    this.reponseOuverte.set(d.id);
    this.texteReponse = d.reponse ?? '';
  }

  protected annulerReponse(): void {
    this.reponseOuverte.set(null);
    this.texteReponse = '';
  }

  protected envoyerReponse(d: Reclamation): void {
    const texte = this.texteReponse.trim();
    if (texte.length < 10) {
      this.erreur.set('La réponse doit faire au moins 10 caractères.');
      return;
    }
    this.erreur.set(null);
    this.actionEnCours.set(d.id);

    this.#reclamations.repondre(d.id, texte).subscribe({
      next: () => {
        this.majDossier(d.id, {
          statut: 'RESOLUE',
          reponse: texte,
          dateReponse: new Date().toISOString().slice(0, 10),
        });
        this.reponseOuverte.set(null);
        this.texteReponse = '';
        this.#notifications.info('Réponse envoyée, dossier clôturé.');
        this.actionEnCours.set(null);
      },
      error: () => {
        this.actionEnCours.set(null);
        this.erreur.set("L'envoi a échoué, réessayez.");
      },
    });
  }

  private majDossier(id: string, patch: Partial<Reclamation>): void {
    this.dossiers.update(liste => liste.map(d => (d.id === id ? { ...d, ...patch } : d)));
  }
}
