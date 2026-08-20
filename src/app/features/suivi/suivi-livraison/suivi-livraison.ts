import { ChangeDetectionStrategy, Component, inject, signal, computed, input,  OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Livraisons } from '../../../core/services/livraisons';
import { Livraison } from '../../../models/livraison.model';
import { Commande } from '../../../models/commande.model';
import { RendezVous } from '../../../models/rendezvous.model';
import { EtapeTimeline, EtatEtape } from '../../../shared/components/etape-timeline/etape-timeline';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-suivi-livraison',
  imports: [EtapeTimeline, Spinner, EtatVide],
  templateUrl: './suivi-livraison.html',
  styleUrl: './suivi-livraison.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuiviLivraison implements OnInit {
  private http = inject(HttpClient);
  private livraisonsService = inject(Livraisons);

  commandeId = input.required<string>();

  protected readonly isLoading = signal(true);
  protected readonly introuvable = signal(false);
  protected readonly commande = signal<Commande | null>(null);
  protected readonly rdv = signal<RendezVous | null>(null);
  protected readonly livraison = signal<Livraison | null>(null);

  protected readonly etapes = computed(() => {
    const l = this.livraison();
    const r = this.rdv();

    const etatColisDepose: EtatEtape = r?.statut === 'CONFIRME' ? 'fait' : 'a-venir';

    let etatTransport: EtatEtape = 'a-venir';
    let etatLivre: EtatEtape = 'a-venir';

    if (l?.statut === 'LIVRE') {
      etatTransport = 'fait';
      etatLivre = 'fait';
    } else if (l?.statut === 'EN_COURS') {
      etatTransport = 'en-cours';
    }

    return [
      { etat: 'fait' as EtatEtape, label: 'Commande confirmée', numero: 1 },
      { etat: etatColisDepose, label: 'Colis déposé', numero: 2 },
      {
        etat: etatTransport,
        label: 'En cours de transport',
        numero: 3,
        sousTexte: l?.statut === 'EN_COURS' ? `Position : ${l.positionActuelle}` : undefined,
      },
      {
        etat: etatLivre,
        label: 'Livré',
        numero: 4,
        sousTexte: etatLivre !== 'fait' && l ? `Livraison estimée : ${l.dateEstimee}` : undefined,
      },
    ];
  });
  ngOnInit(): void {
  this.charger();
}
  private charger(): void {
    this.isLoading.set(true);
    this.introuvable.set(false);

    this.livraisonsService.getByCommande(this.commandeId()).pipe(
      switchMap(livraison => {
        if (!livraison) {
          return of(null);
        }
        return forkJoin({
          livraison: of(livraison),
          commande: this.http.get<Commande>(`${API}/commandes/${this.commandeId()}`),
          rdvListe: this.http.get<RendezVous[]>(`${API}/rendezvous`, {
            params: { commandeId: this.commandeId() },
          }),
        });
      }),
      catchError(() => of(null))
    ).subscribe(res => {
      if (!res) {
        this.introuvable.set(true);
      } else {
        this.livraison.set(res.livraison);
        this.commande.set(res.commande);
        this.rdv.set(res.rdvListe[0] ?? null);
      }
      this.isLoading.set(false);
    });
  }
}