import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Trajets } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { FormulaireTrajet } from '../formulaire-trajet/formulaire-trajet';

@Component({
  selector: 'app-mes-trajets',
  imports: [Spinner, EtatVide, FormulaireTrajet],
  templateUrl: './mes-trajets.html',
  styleUrl: './mes-trajets.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesTrajets implements OnInit {
  private trajetsService = inject(Trajets);
  private auth = inject(Auth);

  protected readonly isLoading = signal(true);
  protected readonly trajets = signal<Trajet[]>([]);
  protected readonly erreur = signal<string | null>(null);
  protected readonly suppressionEnCours = signal<string | null>(null);

  protected readonly modalOuverte = signal(false);
  protected readonly trajetEnEdition = signal<Trajet | null>(null);

  ngOnInit(): void {
    this.charger();
  }

  private charger(): void {
    const transporteurId = this.auth.currentUser()?.transporteurId;
    if (!transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      this.isLoading.set(false);
      return;
    }
    this.isLoading.set(true);
    this.trajetsService.getByTransporteur(transporteurId).subscribe({
      next: (data) => {
        this.trajets.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger vos trajets.');
        this.isLoading.set(false);
      },
    });
  }

  protected ouvrirCreation(): void {
    this.trajetEnEdition.set(null);
    this.modalOuverte.set(true);
  }

  protected ouvrirEdition(trajet: Trajet): void {
    this.trajetEnEdition.set(trajet);
    this.modalOuverte.set(true);
  }

  protected fermerModal(): void {
    this.modalOuverte.set(false);
  }

  protected onTrajetEnregistre(): void {
    this.modalOuverte.set(false);
    this.charger();
  }

  protected supprimer(trajet: Trajet): void {
    const ok = confirm(`Supprimer le trajet vers ${trajet.destination} ?`);
    if (!ok) return;

    this.suppressionEnCours.set(trajet.id);
    this.trajetsService.supprimer(trajet.id).subscribe({
      next: () => {
        this.trajets.update(liste => liste.filter(t => t.id !== trajet.id));
        this.suppressionEnCours.set(null);
      },
      error: () => this.suppressionEnCours.set(null),
    });
  }
}