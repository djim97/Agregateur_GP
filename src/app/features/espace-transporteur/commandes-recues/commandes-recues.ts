import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Trajets } from '../../../core/services/trajets';
import { Rendezvous } from '../../../core/services/rendezvous';
import { Auth } from '../../../core/services/auth';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { Livraison } from '../../../models/livraison.model';
import { BadgeStatut } from '../../../shared/components/badge-statut/badge-statut';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';
import { Notifications } from '../../../core/services/notifications';
import { PATHS } from '../../../app.paths';

const API = 'http://localhost:3000';

interface LigneCommande {
  commande: Commande;
  rdv: RendezVous | null;
  livraison: Livraison | null;
}

@Component({
  selector: 'app-commandes-recues',
  imports: [RouterLink, BadgeStatut, Spinner, EtatVide],
  templateUrl: './commandes-recues.html',
  styleUrl: './commandes-recues.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandesRecues implements OnInit {
  private http = inject(HttpClient);
  private trajetsService = inject(Trajets);
  private rendezvousService = inject(Rendezvous);
  private auth = inject(Auth);
  private notifications = inject(Notifications);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly lignes = signal<LigneCommande[]>([]);
  protected readonly actionEnCours = signal<string | null>(null);
  protected readonly numeroCommande = formatCommandeNumber;
  protected readonly livraisonDetail = PATHS.livraisonDetail;

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

    this.trajetsService.getByTransporteur(transporteurId).pipe(
      switchMap(trajets => {
        if (trajets.length === 0) return of([] as Commande[]);
        const appels = trajets.map(t =>
          this.http.get<Commande[]>(`${API}/commandes`, { params: { trajetId: t.id } })
        );
        return forkJoin(appels).pipe(map(listes => listes.flat()));
      }),
      switchMap(commandes => {
        if (commandes.length === 0) {
          return of({ commandes, rdvListe: [] as RendezVous[], livraisonsListe: [] as Livraison[] });
        }
        return forkJoin({
          rdvListe: this.http.get<RendezVous[]>(`${API}/rendezvous`),
          livraisonsListe: this.http.get<Livraison[]>(`${API}/livraisons`),
        }).pipe(map(res => ({ commandes, ...res })));
      }),
      catchError(() => {
        this.erreur.set('Impossible de charger les commandes.');
        return of({ commandes: [] as Commande[], rdvListe: [] as RendezVous[], livraisonsListe: [] as Livraison[] });
      })
    ).subscribe(({ commandes, rdvListe, livraisonsListe }) => {
      const lignes: LigneCommande[] = commandes.map(commande => ({
        commande,
        rdv: rdvListe.find(r => r.commandeId === commande.id) ?? null,
        livraison: livraisonsListe.find(l => l.commandeId === commande.id) ?? null,
      }));
      this.lignes.set(lignes);
      this.isLoading.set(false);
    });
  }

  /**
   * ÉVOLUTION FRET (E8) : à la confirmation du RDV, la livraison est créée
   * immédiatement si elle n'existe pas encore. Le bouton "MAJ livraison"
   * apparaît donc sur la ligne sans navigation ni rechargement.
   */
  protected confirmerRdv(rdv: RendezVous): void {
    this.actionEnCours.set(rdv.id);
    this.rendezvousService.update(rdv.id, { statut: 'CONFIRME' }).pipe(
      switchMap(() => {
        const ligne = this.lignes().find(l => l.rdv?.id === rdv.id);
        if (ligne && !ligne.livraison) {
          // créer la livraison associée pour rendre la MAJ disponible tout de suite
          return this.http.post<Livraison>(`${API}/livraisons`, {
            commandeId: rdv.commandeId,
            statut: 'EN_ATTENTE',
            positionActuelle: 'En attente de dépôt',
            dateEstimee: '',
          });
        }
        return of(null);
      })
    ).subscribe({
      next: livraison => {
        this.majLigneLocale(rdv.id, 'CONFIRME', livraison ?? undefined);
        this.notifications.info('Rendez-vous confirmé. La mise à jour de livraison est disponible.');
        this.actionEnCours.set(null);
      },
      error: () => this.actionEnCours.set(null),
    });
  }

  protected annulerRdv(rdv: RendezVous): void {
    this.actionEnCours.set(rdv.id);
    this.rendezvousService.update(rdv.id, { statut: 'ANNULE' }).subscribe({
      next: () => {
        this.majLigneLocale(rdv.id, 'ANNULE');
        this.notifications.info('Rendez-vous annulé.');
        this.actionEnCours.set(null);
      },
      error: () => this.actionEnCours.set(null),
    });
  }

  private majLigneLocale(rdvId: string, statut: RendezVous['statut'], livraison?: Livraison): void {
    this.lignes.update(liste =>
      liste.map(l => {
        if (l.rdv?.id !== rdvId) return l;
        return {
          ...l,
          rdv: { ...l.rdv, statut },
          livraison: livraison ?? l.livraison,
        };
      })
    );
  }
}
