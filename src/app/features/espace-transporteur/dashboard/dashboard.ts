import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router'; 
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Trajets } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { Spinner } from '../../../shared/components/spinner/spinner';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-dashboard',
  imports: [Spinner, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private http = inject(HttpClient);
  private trajetsService = inject(Trajets);
  private auth = inject(Auth);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal(false);

  protected readonly trajetsActifs = signal(0);
  protected readonly commandesRecues = signal(0);
  protected readonly rdvAConfirmer = signal(0);

  ngOnInit(): void {
    const transporteurId = this.auth.currentUser()?.transporteurId;

    if (!transporteurId) {
      this.erreur.set(true);
      this.isLoading.set(false);
      return;
    }

    this.trajetsService.getByTransporteur(transporteurId).pipe(
      switchMap((trajets: Trajet[]) => {
        this.trajetsActifs.set(trajets.length);

        if (trajets.length === 0) {
          return of({ commandes: [] as Commande[], trajets });
        }

        const appelsCommandes = trajets.map(t =>
          this.http.get<Commande[]>(`${API}/commandes`, { params: { trajetId: t.id } })
        );

        return forkJoin(appelsCommandes).pipe(
          map(listes => ({ commandes: listes.flat(), trajets }))
        );
      }),
      switchMap(({ commandes }) => {
        if (commandes.length === 0) {
          return of({ commandes, rdv: [] as RendezVous[] });
        }
        const commandeIds = new Set(commandes.map(c => c.id));
        return this.http.get<RendezVous[]>(`${API}/rendezvous`).pipe(
          map(tousLesRdv => ({
            commandes,
            rdv: tousLesRdv.filter(r => commandeIds.has(r.commandeId)),
          }))
        );
      }),
      catchError(() => {
        this.erreur.set(true);
        return of({ commandes: [] as Commande[], rdv: [] as RendezVous[] });
      })
    ).subscribe(({ commandes, rdv }) => {
      this.commandesRecues.set(commandes.length);
      this.rdvAConfirmer.set(rdv.filter(r => r.statut === 'EN_ATTENTE').length);
      this.isLoading.set(false);
    });
  }
}