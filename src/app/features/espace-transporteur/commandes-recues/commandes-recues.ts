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

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly lignes = signal<LigneCommande[]>([]);
  protected readonly actionEnCours = signal<string | null>(null);

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

  protected confirmerRdv(rdv: RendezVous): void {
    this.actionEnCours.set(rdv.id);
    this.rendezvousService.update(rdv.id, { statut: 'CONFIRME' }).subscribe({
      next: () => { this.majStatutLocal(rdv.id, 'CONFIRME'); this.actionEnCours.set(null); },
      error: () => this.actionEnCours.set(null),
    });
  }

  protected annulerRdv(rdv: RendezVous): void {
    this.actionEnCours.set(rdv.id);
    this.rendezvousService.update(rdv.id, { statut: 'ANNULE' }).subscribe({
      next: () => { this.majStatutLocal(rdv.id, 'ANNULE'); this.actionEnCours.set(null); },
      error: () => this.actionEnCours.set(null),
    });
  }

  private majStatutLocal(rdvId: string, statut: RendezVous['statut']): void {
    this.lignes.update(liste =>
      liste.map(l => l.rdv?.id === rdvId ? { ...l, rdv: { ...l.rdv, statut } } : l)
    );
  }
}