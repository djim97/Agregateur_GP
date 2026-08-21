import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { Trajets } from '../../../core/services/trajets';
import { Transporteurs } from '../../../core/services/transporteurs';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';
import { Commande } from '../../../models/commande.model';
import {
  formatMontant, convertir, conversionExacte,
  DEVISE_DEFAUT, CodeDevise, devise as infoDevise,
} from '../../../models/devises';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { PATHS } from '../../../app.paths';

const API = 'http://localhost:3000';

interface LigneDevise {
  devise: string;
  nbCommandes: number;
  total: number;
  libelle: string;
  converti: number;
  libelleConverti: string;
  partPct: number;
}

interface LigneTrajet {
  destination: string;
  dateDepart: string;
  nbCommandes: number;
  total: number;
  libelle: string;
  converti: number;
}

interface LigneMois {
  mois: string;       // "2026-08"
  libelleMois: string; // "août 2026"
  converti: number;
  libelle: string;
  hauteurPct: number;
}

/**
 * Détail des revenus du transporteur.
 * Le total est exprimé dans sa devise de référence (profil) ; le détail
 * par devise montre les montants RÉELLEMENT facturés, sans conversion.
 */
@Component({
  selector: 'app-revenus',
  imports: [RouterLink, Spinner, EtatVide],
  templateUrl: './revenus.html',
  styleUrl: './revenus.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Revenus implements OnInit {
  readonly #http = inject(HttpClient);
  readonly #trajetsService = inject(Trajets);
  readonly #transporteurs = inject(Transporteurs);
  readonly #auth = inject(Auth);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly commandes = signal<Commande[]>([]);
  protected readonly trajets = signal<Trajet[]>([]);
  protected readonly deviseReference = signal<CodeDevise>(DEVISE_DEFAUT);

  protected readonly retourDashboard = '/' + PATHS.espaceTransporteur;

  /** Totaux par devise de facturation, avec équivalent dans la devise de référence */
  protected readonly parDevise = computed<LigneDevise[]>(() => {
    const ref = this.deviseReference();
    const agr = new Map<string, { total: number; nb: number }>();
    this.commandes().forEach(c => {
      const d = c.devise ?? DEVISE_DEFAUT;
      const e = agr.get(d) ?? { total: 0, nb: 0 };
      e.total += c.prixCalcule ?? 0;
      e.nb += 1;
      agr.set(d, e);
    });

    const lignes = [...agr.entries()].map(([devise, { total, nb }]) => ({
      devise,
      nbCommandes: nb,
      total,
      libelle: formatMontant(total, devise),
      converti: convertir(total, devise, ref),
      libelleConverti: formatMontant(convertir(total, devise, ref), ref),
      partPct: 0,
    }));

    const somme = lignes.reduce((s, l) => s + l.converti, 0) || 1;
    lignes.forEach(l => (l.partPct = Math.round((l.converti / somme) * 100)));
    return lignes.sort((a, b) => b.converti - a.converti);
  });

  /** Total général, converti dans la devise de référence */
  protected readonly totalConverti = computed(() =>
    this.parDevise().reduce((s, l) => s + l.converti, 0)
  );
  protected readonly totalLibelle = computed(() =>
    formatMontant(this.totalConverti(), this.deviseReference())
  );
  protected readonly totalExact = computed(() =>
    conversionExacte(this.parDevise().map(l => l.devise), this.deviseReference())
  );
  protected readonly libelleReference = computed(() => infoDevise(this.deviseReference()).libelle);

  /** Revenus par trajet, du plus rentable au moins rentable */
  protected readonly parTrajet = computed<LigneTrajet[]>(() => {
    const ref = this.deviseReference();
    const parId = new Map(this.trajets().map(t => [String(t.id), t]));
    const agr = new Map<string, { total: number; nb: number; devise: string }>();

    this.commandes().forEach(c => {
      const cle = String(c.trajetId);
      const e = agr.get(cle) ?? { total: 0, nb: 0, devise: c.devise ?? DEVISE_DEFAUT };
      e.total += c.prixCalcule ?? 0;
      e.nb += 1;
      agr.set(cle, e);
    });

    return [...agr.entries()]
      .map(([trajetId, { total, nb, devise }]) => {
        const t = parId.get(trajetId);
        return {
          destination: t?.destination ?? 'Trajet supprimé',
          dateDepart: t?.dateDepart ?? '',
          nbCommandes: nb,
          total,
          libelle: formatMontant(total, devise),
          converti: convertir(total, devise, ref),
        };
      })
      .sort((a, b) => b.converti - a.converti);
  });

  /** Évolution mensuelle, en devise de référence */
  protected readonly parMois = computed<LigneMois[]>(() => {
    const ref = this.deviseReference();
    const agr = new Map<string, number>();
    this.commandes().forEach(c => {
      const mois = (c.dateCommande ?? '').slice(0, 7);
      if (!mois) return;
      agr.set(mois, (agr.get(mois) ?? 0) + convertir(c.prixCalcule ?? 0, c.devise ?? DEVISE_DEFAUT, ref));
    });

    const lignes = [...agr.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
    const max = Math.max(...lignes.map(([, v]) => v), 1);
    return lignes.map(([mois, converti]) => ({
      mois,
      libelleMois: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      converti,
      libelle: formatMontant(converti, ref),
      hauteurPct: Math.round((converti / max) * 100),
    }));
  });

  protected readonly nbCommandes = computed(() => this.commandes().length);
  protected readonly panierMoyen = computed(() => {
    const n = this.nbCommandes();
    if (n === 0) return '';
    return formatMontant(this.totalConverti() / n, this.deviseReference());
  });

  ngOnInit(): void {
    const transporteurId = this.#auth.currentUser()?.transporteurId;
    if (!transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.#transporteurs.getById(transporteurId).subscribe({
      next: t => this.deviseReference.set((t.deviseReference as CodeDevise) ?? DEVISE_DEFAUT),
      error: () => this.deviseReference.set(DEVISE_DEFAUT),
    });

    this.#trajetsService
      .getByTransporteur(transporteurId)
      .pipe(
        switchMap(trajets => {
          this.trajets.set(trajets);
          if (trajets.length === 0) return of([] as Commande[]);
          return forkJoin(
            trajets.map(t => this.#http.get<Commande[]>(`${API}/commandes`, { params: { trajetId: t.id } }))
          ).pipe(map(listes => listes.flat()));
        }),
        catchError(() => {
          this.erreur.set('Impossible de charger vos revenus.');
          return of([] as Commande[]);
        })
      )
      .subscribe(commandes => {
        this.commandes.set(commandes);
        this.isLoading.set(false);
      });
  }
}
