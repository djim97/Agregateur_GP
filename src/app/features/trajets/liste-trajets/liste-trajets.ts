import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Trajets, CriteresRecherche } from '../../../core/services/trajets';
import { Trajet, capaciteRestante } from '../../../models/trajet.model';
import { CATEGORIES_PRODUITS, NiveauFragilite } from '../../../models/produits';
import { verifierCompatibilite, DescriptionColis } from '../../../models/compatibilite';
import { PATHS } from '../../../app.paths';
import { AvisService } from '../../../core/services/avis';
import { Avis, moyenneAvis, avisSurTransporteurs } from '../../../models/avis.model';
import { MontantDevisePipe } from '../../../shared/pipes/montant-devise-pipe';

type EtatListe = 'chargement' | 'resultats' | 'vide' | 'erreur';

@Component({
  selector: 'app-liste-trajets',
  imports: [ReactiveFormsModule, RouterLink, MontantDevisePipe],
  templateUrl: './liste-trajets.html',
  styleUrl: './liste-trajets.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListeTrajets {
  readonly #trajetsService = inject(Trajets);
  readonly #fb = inject(FormBuilder);
  readonly #route = inject(ActivatedRoute);
  readonly #avisService = inject(AvisService);

  readonly trajets = signal<Trajet[]>([]);
  readonly etat = signal<EtatListe>('chargement');
  readonly page = signal(1);
  readonly LIMITE = 5;
  readonly aPageSuivante = signal(false);

  readonly trajetDetail = PATHS.trajetDetail;

  /** Avis de tous les transporteurs affichés (vide si non connecté) */
  readonly #avis = signal<Avis[]>([]);

  /**
   * Note réelle par transporteur, calculée depuis les avis.
   * Les avis exigent une session : si la liste est consultée sans compte,
   * on retombe sur la note enregistrée sur la fiche du transporteur.
   */
  readonly notesParTransporteur = computed(() => {
    const parTransporteur = new Map<string, Avis[]>();
    this.#avis().forEach(a => {
      const cle = String(a.transporteurId ?? '');
      if (!cle) return;
      parTransporteur.set(cle, [...(parTransporteur.get(cle) ?? []), a]);
    });
    const notes = new Map<string, { note: number; nb: number }>();
    parTransporteur.forEach((liste, cle) =>
      notes.set(cle, { note: moyenneAvis(liste), nb: liste.length })
    );
    return notes;
  });

  /** Note à afficher pour un transporteur donné */
  noteAffichee(transporteurId: string, noteFiche: number): { note: number; nb: number } {
    return this.notesParTransporteur().get(String(transporteurId)) ?? { note: noteFiche, nb: 0 };
  }
  readonly categories = CATEGORIES_PRODUITS;
  readonly capaciteRestante = capaciteRestante;

  // ---- Filtres classiques ----
  readonly filtres = this.#fb.nonNullable.group({
    destination: [''],
    prixKiloMax: [null as number | null],
    tri: ['dateDepart' as 'prixParKilo' | 'dateDepart'],
  });

  // ---- ÉVOLUTION FRET : description du colis (décision 5, filtrage auto) ----
  readonly decrireColis = signal(false);          // panneau replié par défaut
  readonly colisForm = this.#fb.nonNullable.group({
    poids: [null as number | null],
    L: [null as number | null],
    l: [null as number | null],
    h: [null as number | null],
    niveauFragilite: ['AUCUNE' as NiveauFragilite],
    categorieProduit: ['' as string],
  });
  readonly colisApplique = signal<DescriptionColis | null>(null);

  /** Trajets réellement affichés : filtrés par compatibilité si un colis est décrit */
  readonly trajetsAffiches = computed(() => {
    const colis = this.colisApplique();
    const liste = this.trajets();
    if (!colis) return liste;
    return liste.filter(t =>
      t.transporteur ? verifierCompatibilite(t, t.transporteur, colis).compatible : true
    );
  });

  constructor() {
    const query = this.#route.snapshot.queryParamMap;
    this.filtres.patchValue({
      destination: query.get('destination') ?? '',
      prixKiloMax: query.get('prixKiloMax') ? Number(query.get('prixKiloMax')) : null,
    });
    this.rechercher();

    // Un seul appel pour toutes les notes ; sans session, on garde les notes de fiche
    this.#avisService
      .getTous()
      .pipe(catchError(() => of([] as Avis[])))
      .subscribe(avis => this.#avis.set(avisSurTransporteurs(avis)));
  }

  rechercher(): void {
    this.page.set(1);
    this.appliquerColis();
    this.charger();
  }

  reinitialiser(): void {
    this.filtres.reset();
    this.colisForm.reset({ poids: null, L: null, l: null, h: null, niveauFragilite: 'AUCUNE', categorieProduit: '' });
    this.colisApplique.set(null);
    this.rechercher();
  }

  basculerColis(): void {
    this.decrireColis.update(v => !v);
  }

  /** Fige la description du colis pour le filtrage (tous les champs requis, sinon pas de filtre) */
  private appliquerColis(): void {
    const v = this.colisForm.getRawValue();
    if (v.poids && v.L && v.l && v.h && v.categorieProduit) {
      this.colisApplique.set({
        poids: v.poids,
        dimensions: { L: v.L, l: v.l, h: v.h },
        niveauFragilite: v.niveauFragilite,
        categorieProduit: v.categorieProduit,
      });
    } else {
      this.colisApplique.set(null);
    }
  }

  pageSuivante(): void { this.page.update(p => p + 1); this.charger(); }
  pagePrecedente(): void { this.page.update(p => Math.max(1, p - 1)); this.charger(); }

  private charger(): void {
    this.etat.set('chargement');
    const { destination, prixKiloMax, tri } = this.filtres.getRawValue();
    const criteres: CriteresRecherche = {
      destination: destination || undefined,
      prixKiloMax: prixKiloMax ?? undefined,
      tri, ordre: 'asc',
      page: this.page(), limite: this.LIMITE,
    };
    this.#trajetsService.search(criteres).subscribe({
      next: trajets => {
        this.trajets.set(trajets);
        this.aPageSuivante.set(trajets.length === this.LIMITE);
        this.etat.set(trajets.length === 0 ? 'vide' : 'resultats');
      },
      error: () => this.etat.set('erreur'),
    });
  }
}
