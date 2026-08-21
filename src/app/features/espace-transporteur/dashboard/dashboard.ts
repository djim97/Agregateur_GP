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
import { Livraison } from '../../../models/livraison.model';
import { Avis, moyenneAvis } from '../../../models/avis.model';
import { formatMontant, convertir, conversionExacte, DEVISE_DEFAUT, CodeDevise } from '../../../models/devises';
import { Transporteurs } from '../../../core/services/transporteurs';
import { AvisService } from '../../../core/services/avis';
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
  private avisService = inject(AvisService);
  private transporteursService = inject(Transporteurs);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal(false);

  protected readonly trajetsActifs = signal(0);
  protected readonly commandesRecues = signal(0);
  protected readonly rdvAConfirmer = signal(0);

  // ---- Données brutes pour les graphes ----
  protected readonly trajets = signal<Trajet[]>([]);
  protected readonly commandes = signal<Commande[]>([]);
  protected readonly livraisons = signal<Livraison[]>([]);
  protected readonly avis = signal<Avis[]>([]);
  /** Devise de lecture choisie par le transporteur (profil) */
  protected readonly deviseReference = signal<CodeDevise>(DEVISE_DEFAUT);

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
    // Restreint à la devise principale : on ne mélange pas les monnaies.
    const principale = this.devisePrincipale();
    const parJour = new Map<string, number>();
    this.commandes()
      .filter(c => (c.devise ?? DEVISE_DEFAUT) === principale)
      .forEach(c => {
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

  /**
   * Chiffre d'affaires PAR DEVISE. Additionner des francs CFA et des euros
   * n'aurait aucun sens : chaque devise a son propre total.
   */
  protected readonly caParDevise = computed(() => {
    const totaux = new Map<string, number>();
    this.commandes().forEach(c => {
      const d = c.devise ?? DEVISE_DEFAUT;
      totaux.set(d, (totaux.get(d) ?? 0) + (c.prixCalcule ?? 0));
    });
    return [...totaux.entries()]
      .map(([devise, total]) => ({ devise, total, libelle: formatMontant(total, devise) }))
      .sort((a, b) => b.total - a.total);
  });

  /**
   * Chiffre d'affaires TOTAL, converti dans la devise de référence.
   * La facturation, elle, reste dans la devise de chaque trajet.
   */
  protected readonly caTotalConverti = computed(() => {
    const ref = this.deviseReference();
    const total = this.caParDevise().reduce(
      (somme, ligne) => somme + convertir(ligne.total, ligne.devise, ref),
      0
    );
    return formatMontant(total, ref);
  });

  /** Le total repose-t-il uniquement sur des taux fixes (XOF/EUR) ? */
  protected readonly totalExact = computed(() =>
    conversionExacte(this.caParDevise().map(l => l.devise), this.deviseReference())
  );

  /** Plusieurs devises en jeu : on affiche le détail sous le total */
  protected readonly plusieursDevises = computed(() => this.caParDevise().length > 1);

  /** Devise principale du transporteur (celle qui pèse le plus) */
  protected readonly devisePrincipale = computed(
    () => this.caParDevise()[0]?.devise ?? DEVISE_DEFAUT
  );


  // ===== INDICATEURS DE QUALITÉ DE SERVICE =====

  /** Livraisons effectivement terminées (date réelle connue) */
  readonly #livrees = computed(() =>
    this.livraisons().filter(l => l.statut === 'LIVRE' && !!l.dateLivraisonReelle)
  );

  /**
   * Temps de livraison moyen, en jours : entre la date de commande
   * et la date de livraison réelle.
   */
  protected readonly tempsMoyenJours = computed<number | null>(() => {
    const parCommande = new Map(this.commandes().map(c => [String(c.id), c]));
    const durees: number[] = [];

    this.#livrees().forEach(l => {
      const commande = parCommande.get(String(l.commandeId));
      if (!commande?.dateCommande || !l.dateLivraisonReelle) return;
      const depart = new Date(commande.dateCommande).getTime();
      const arrivee = new Date(l.dateLivraisonReelle).getTime();
      if (Number.isNaN(depart) || Number.isNaN(arrivee) || arrivee < depart) return;
      durees.push((arrivee - depart) / 86400000);
    });

    if (durees.length === 0) return null;
    const moyenne = durees.reduce((s, d) => s + d, 0) / durees.length;
    return Math.round(moyenne * 10) / 10;
  });

  /**
   * Respect des délais : part des livraisons arrivées au plus tard
   * à la date estimée annoncée au client.
   */
  protected readonly respectDelaisPct = computed<number | null>(() => {
    const avecEstimation = this.#livrees().filter(l => !!l.dateEstimee);
    if (avecEstimation.length === 0) return null;
    const aLheure = avecEstimation.filter(
      l => new Date(l.dateLivraisonReelle!).getTime() <= new Date(l.dateEstimee).getTime()
    ).length;
    return Math.round((aLheure / avecEstimation.length) * 100);
  });

  /** Nombre de livraisons servant de base aux deux indicateurs ci-dessus */
  protected readonly baseLivrees = computed(() => this.#livrees().length);

  /** Taux de satisfaction : moyenne des avis ramenée sur 100 */
  protected readonly satisfactionPct = computed<number | null>(() => {
    const liste = this.avis();
    if (liste.length === 0) return null;
    return Math.round((moyenneAvis(liste) / 5) * 100);
  });

  protected readonly noteMoyenne = computed(() => moyenneAvis(this.avis()));
  protected readonly nbAvis = computed(() => this.avis().length);

  /** Couleur de la jauge selon le niveau atteint */
  protected niveau(pct: number | null): 'bon' | 'moyen' | 'faible' {
    if (pct === null) return 'moyen';
    if (pct >= 80) return 'bon';
    if (pct >= 50) return 'moyen';
    return 'faible';
  }

  ngOnInit(): void {
    const transporteurId = this.auth.currentUser()?.transporteurId;

    if (!transporteurId) {
      this.erreur.set(true);
      this.isLoading.set(false);
      return;
    }

    this.transporteursService.getById(transporteurId).subscribe({
      next: t => this.deviseReference.set(t.deviseReference ?? DEVISE_DEFAUT),
      error: () => this.deviseReference.set(DEVISE_DEFAUT),
    });

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
        const commandeIds = new Set(commandes.map(c => String(c.id)));
        return forkJoin({
          rdv: this.http.get<RendezVous[]>(`${API}/rendezvous`),
          livraisons: this.http.get<Livraison[]>(`${API}/livraisons`),
          avis: this.avisService
            .getByTransporteur(this.auth.currentUser()?.transporteurId ?? '')
            .pipe(catchError(() => of([] as Avis[]))),
        }).pipe(
          map(({ rdv, livraisons, avis }) => ({
            commandes,
            rdv: rdv.filter(r => commandeIds.has(String(r.commandeId))),
            livraisons: livraisons.filter(l => commandeIds.has(String(l.commandeId))),
            avis,
          }))
        );
      }),
      catchError(() => {
        this.erreur.set(true);
        return of({
          commandes: [] as Commande[], rdv: [] as RendezVous[],
          livraisons: [] as Livraison[], avis: [] as Avis[],
        });
      })
    ).subscribe(({ commandes, rdv, livraisons, avis }) => {
      this.commandes.set(commandes);
      this.commandesRecues.set(commandes.length);
      this.rdvAConfirmer.set(rdv.filter(r => r.statut === 'EN_ATTENTE').length);
      this.livraisons.set(livraisons);
      this.avis.set(avis);
      this.isLoading.set(false);
    });
  }
}
