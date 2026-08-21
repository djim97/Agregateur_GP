import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Trajets } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet, capaciteRestante } from '../../../models/trajet.model';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { Spinner } from '../../../shared/components/spinner/spinner';

const API = 'http://localhost:3000';

/** Segment du donut des statuts */
interface SegmentStatut {
  label: string;
  valeur: number;
  couleur: string;
  offset: number;   // début du segment (0..1)
  part: number;     // fraction du total (0..1)
}

/** Barre du graphe CA par jour */
interface BarreCA {
  jour: string;     // "20/08"
  montant: number;
  hauteurPct: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [Spinner, RouterLink, DecimalPipe],
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

  // ---- Données brutes pour les graphes ----
  protected readonly trajets = signal<Trajet[]>([]);
  protected readonly commandes = signal<Commande[]>([]);

  protected readonly capaciteRestante = capaciteRestante;

  /** GRAPHE 1 : remplissage par trajet (kg réservés / capacité) */
  protected readonly remplissage = computed(() =>
    this.trajets().map(t => ({
      destination: t.destination,
      reserves: t.kilosReserves,
      capacite: t.capaciteKilosTotale,
      pct: Math.min(100, Math.round((t.kilosReserves / t.capaciteKilosTotale) * 100)),
      complet: t.complet || t.kilosReserves >= t.capaciteKilosTotale,
    }))
  );

  /** GRAPHE 2 : donut des statuts de commandes */
  protected readonly segmentsStatuts = computed<SegmentStatut[]>(() => {
    const cmds = this.commandes();
    const total = cmds.length || 1;
    const defs = [
      { statut: 'EN_ATTENTE', label: 'En attente', couleur: '#d9a441' },
      { statut: 'EN_COURS',   label: 'En cours',   couleur: '#3b6fb5' },
      { statut: 'LIVREE',     label: 'Livrées',    couleur: '#0f766e' },
    ];
    let offset = 0;
    return defs.map(d => {
      const valeur = cmds.filter(c => c.statut === d.statut).length;
      const part = valeur / total;
      const seg: SegmentStatut = { label: d.label, valeur, couleur: d.couleur, offset, part };
      offset += part;
      return seg;
    });
  });

  /** Circonférence du donut (r = 40) pour stroke-dasharray */
  protected readonly CIRC = 2 * Math.PI * 40;

  /** GRAPHE 3 : chiffre d'affaires (prixCalcule) par jour, 7 derniers jours avec activité */
  protected readonly barresCA = computed<BarreCA[]>(() => {
    const parJour = new Map<string, number>();
    this.commandes().forEach(c => {
      parJour.set(c.dateCommande, (parJour.get(c.dateCommande) ?? 0) + (c.prixCalcule ?? 0));
    });
    const jours = [...parJour.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
    const max = Math.max(...jours.map(([, m]) => m), 1);
    return jours.map(([iso, montant]) => ({
      jour: iso.slice(8, 10) + '/' + iso.slice(5, 7),
      montant,
      hauteurPct: Math.round((montant / max) * 100),
    }));
  });

  /** CA total (somme des prix calculés) */
  protected readonly caTotal = computed(() =>
    this.commandes().reduce((s, c) => s + (c.prixCalcule ?? 0), 0)
  );

  ngOnInit(): void {
    const transporteurId = this.auth.currentUser()?.transporteurId;

    if (!transporteurId) {
      this.erreur.set(true);
      this.isLoading.set(false);
      return;
    }

    this.trajetsService.getByTransporteur(transporteurId).pipe(
      switchMap((trajets: Trajet[]) => {
        this.trajets.set(trajets);
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
      this.commandes.set(commandes);
      this.commandesRecues.set(commandes.length);
      this.rdvAConfirmer.set(rdv.filter(r => r.statut === 'EN_ATTENTE').length);
      this.isLoading.set(false);
    });
  }
}
