import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { Commandes } from '../../../core/services/commandes';
import { Auth } from '../../../core/services/auth';
import { AvisService } from '../../../core/services/avis';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { Avis } from '../../../models/avis.model';
import { BadgeStatut } from '../../../shared/components/badge-statut/badge-statut';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { FormsModule } from '@angular/forms';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

const API = 'http://localhost:3000';

type Onglet = 'en-cours' | 'livrees' | 'rendez-vous';

@Component({
  selector: 'app-mes-commandes',
  imports: [RouterLink, BadgeStatut, Spinner, EtatVide, FormsModule],
  templateUrl: './mes-commandes.html',
  styleUrl: './mes-commandes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesCommandes {
  private http = inject(HttpClient);
  private commandesService = inject(Commandes);
  private auth = inject(Auth);
  private router = inject(Router);
  private avisService = inject(AvisService);

  protected readonly paths = PATHS;
  protected readonly query = QUERY;
  protected readonly numeroCommande = formatCommandeNumber;

  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly commandes = signal<Commande[]>([]);
  protected readonly rendezvous = signal<RendezVous[]>([]);
  protected readonly avis = signal<Avis[]>([]);
  protected readonly ongletActif = signal<Onglet>('en-cours');

  // --- Mini-formulaire d'avis ---
  protected readonly avisEnCours = signal<string | null>(null); // commandeId ouvert
  protected readonly noteSaisie = signal(0);
  protected readonly commentaireSaisie = signal('');
  protected readonly etoiles = [1, 2, 3, 4, 5];

  /** Map commandeId -> RendezVous */
  protected readonly rdvParCommande = computed(() => {
    const map = new Map<string, RendezVous>();
    this.rendezvous().forEach(r => map.set(r.commandeId, r));
    return map;
  });

  /** Map commandeId -> Avis (pour savoir si déjà noté) */
  protected readonly avisParCommande = computed(() => {
    const map = new Map<string, Avis>();
    this.avis().forEach(a => map.set(a.commandeId, a));
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

  // --- Avis ---
  protected ouvrirAvis(commandeId: string): void {
    this.avisEnCours.set(commandeId);
    this.noteSaisie.set(0);
    this.commentaireSaisie.set('');
  }

  protected annulerAvis(): void {
    this.avisEnCours.set(null);
  }

  protected choisirNote(note: number): void {
    this.noteSaisie.set(note);
  }

  protected soumettreAvis(commande: Commande): void {
    if (this.noteSaisie() < 1) return;
    // Le transporteurId est résolu par le service (commande -> trajet)
    const nouvel: Omit<Avis, 'id' | 'transporteurId'> = {
      commandeId: commande.id,
      clientId: this.auth.currentUser()!.id,
      note: this.noteSaisie(),
      commentaire: this.commentaireSaisie().trim(),
      date: new Date().toISOString().slice(0, 10),
    };
    this.avisService.creer(nouvel).subscribe({
      next: cree => {
        this.avis.update(liste => [...liste, cree]);
        this.avisEnCours.set(null);
      },
    });
  }

  private charger(): void {
    const clientId = this.auth.currentUser()!.id;
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      commandes: this.commandesService.getByClient(clientId),
      rendezvous: this.http.get<RendezVous[]>(`${API}/rendezvous`),
      avis: this.avisService.getEcritsParClient(clientId),
    }).pipe(
      catchError(() => {
        this.error.set('Impossible de charger vos commandes.');
        return of({ commandes: [], rendezvous: [], avis: [] });
      })
    ).subscribe(res => {
      this.commandes.set(res.commandes);
      this.rendezvous.set(res.rendezvous);
      this.avis.set(res.avis);
      this.isLoading.set(false);
    });
  }

  protected statutBadge(statut: Commande['statut']): 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' {
    return statut === 'LIVREE' ? 'LIVRE' : statut;
  }
}