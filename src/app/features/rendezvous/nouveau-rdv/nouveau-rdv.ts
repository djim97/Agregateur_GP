import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Rendezvous } from '../../../core/services/rendezvous';
import { Commande } from '../../../models/commande.model';
import { EtapeTimeline, EtatEtape } from '../../../shared/components/etape-timeline/etape-timeline';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-nouveau-rdv',
  imports: [ReactiveFormsModule, EtapeTimeline, Spinner, EtatVide],
  templateUrl: './nouveau-rdv.html',
  styleUrl: './nouveau-rdv.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NouveauRdv implements OnInit {
  private http = inject(HttpClient);
  private rendezvousService = inject(Rendezvous);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  protected readonly commandeId = signal<string | null>(null);
  protected readonly commande = signal<Commande | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly erreurChargement = signal(false);
  protected readonly enEnvoi = signal(false);
  protected readonly numeroCommande = formatCommandeNumber;

  protected readonly etapesStepper: { etat: EtatEtape; label: string; numero: number }[] = [
    { etat: 'fait', label: 'Commande', numero: 1 },
    { etat: 'en-cours', label: 'Rendez-vous', numero: 2 },
    { etat: 'a-venir', label: 'Confirmation', numero: 3 },
  ];

  protected readonly form = this.fb.nonNullable.group({
    dateHeure: ['', [Validators.required, this.dateFuturValidator]],
    lieu: ['', Validators.required],
  });

  private dateFuturValidator(control: { value: string }) {
    if (!control.value) return null;
    const saisie = new Date(control.value);
    return saisie.getTime() > Date.now() ? null : { datePassee: true };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get(QUERY.commandeId);

    if (!id) {
      this.isLoading.set(false);
      this.erreurChargement.set(true);
      return;
    }

    this.commandeId.set(id);

    this.http.get<Commande>(`${API}/commandes/${id}`).subscribe({
      next: (c) => {
        this.commande.set(c);
        this.isLoading.set(false);
      },
      error: () => {
        this.erreurChargement.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected plusTard(): void {
    this.router.navigate(['/' + PATHS.mesCommandes]);
  }

  protected soumettre(): void {
    if (this.form.invalid || !this.commandeId()) {
      this.form.markAllAsTouched();
      return;
    }

    this.enEnvoi.set(true);
    const { dateHeure, lieu } = this.form.getRawValue();

    this.rendezvousService.creer({
      commandeId: this.commandeId()!,
      date: dateHeure,
      lieu,
    }).subscribe({
      next: () => {
        this.router.navigate(['/' + PATHS.mesCommandes]);
      },
      error: () => {
        this.enEnvoi.set(false);
      },
    });
  }
}