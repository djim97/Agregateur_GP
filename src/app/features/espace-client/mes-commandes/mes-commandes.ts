import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { Commandes } from '../../../core/services/commandes';
import { Auth } from '../../../core/services/auth';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { BadgeStatut } from '../../../shared/components/badge-statut/badge-statut';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

const API = 'http://localhost:3000';

type Onglet = 'en-cours' | 'livrees' | 'rendez-vous';

@Component({
  selector: 'app-mes-commandes',
  imports: [RouterLink, BadgeStatut, Spinner, EtatVide],
  templateUrl: './mes-commandes.html',
  styleUrl: './mes-commandes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesCommandes {
  private http = inject(HttpClient);
  private commandesService = inject(Commandes);
  private auth = inject(Auth);
  private router = inject(Router);

  protected readonly paths = PATHS;
  protected readonly query = QUERY;
  protected readonly numeroCommande = formatCommandeNumber;

  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly commandes = signal<Commande[]>([]);
  protected readonly rendezvous = signal<RendezVous[]>([]);
  protected readonly ongletActif = signal<Onglet>('en-cours');

  /** Map commandeId -> RendezVous, pour affichage rapide dans le tableau */
  protected readonly rdvParCommande = computed(() => {
    const map = new Map<string, RendezVous>();
    this.rendezvous().forEach(r => map.set(r.commandeId, r));
    return map;
  });

  protected readonly commandesFiltrees = computed(() => {
    const onglet = this.ongletActif();
    const rdvMap = this.rdvParCommande();

    return this.commandes().filter(c => {
      if (onglet === 'en-cours') return c.statut === 'EN_ATTENTE' || c.statut === 'EN_COURS';
      if (onglet === 'livrees') return c.statut === 'LIVREE';
      if (onglet === 'rendez-vous') return rdvMap.has(c.id);
      return true;
    });
  });

  constructor() {
    this.charger();
  }

  protected changerOnglet(onglet: Onglet): void {
    this.ongletActif.set(onglet);
  }

  protected prendreRdv(commandeId: string): void {
    this.router.navigate(['/' + this.paths.nouveauRdv], {
      queryParams: { [this.query.commandeId]: commandeId },
    });
  }

  protected voirTrajets(): void {
    this.router.navigate(['/' + this.paths.trajets]);
  }

  private charger(): void {
    const clientId = this.auth.currentUser()!.id;
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      commandes: this.commandesService.getByClient(clientId),
      rendezvous: this.http.get<RendezVous[]>(`${API}/rendezvous`),
    }).pipe(
      catchError(() => {
        this.error.set('Impossible de charger vos commandes.');
        return of({ commandes: [], rendezvous: [] });
      })
    ).subscribe(res => {
      this.commandes.set(res.commandes);
      this.rendezvous.set(res.rendezvous);
      this.isLoading.set(false);
    });
  }

  protected statutBadge(statut: Commande['statut']): 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' {
  return statut === 'LIVREE' ? 'LIVRE' : statut;
  }
}