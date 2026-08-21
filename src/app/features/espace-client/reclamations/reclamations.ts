import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Reclamations as ReclamationsService } from '../../../core/services/reclamations';
import { Commandes } from '../../../core/services/commandes';
import { Auth } from '../../../core/services/auth';
import { Notifications } from '../../../core/services/notifications';
import { Reclamation, MOTIFS_RECLAMATION } from '../../../models/reclamation.model';
import { Commande } from '../../../models/commande.model';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';

@Component({
  selector: 'app-reclamations',
  imports: [ReactiveFormsModule, Spinner, EtatVide],
  templateUrl: './reclamations.html',
  styleUrl: './reclamations.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReclamationsPage implements OnInit {
  readonly #fb = inject(FormBuilder);
  readonly #service = inject(ReclamationsService);
  readonly #commandes = inject(Commandes);
  readonly #auth = inject(Auth);
  readonly #notifications = inject(Notifications);

  protected readonly isLoading = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enEnvoi = signal(false);
  protected readonly formulaireOuvert = signal(false);

  protected readonly reclamations = signal<Reclamation[]>([]);
  protected readonly commandes = signal<Commande[]>([]);

  protected readonly motifs = MOTIFS_RECLAMATION;
  protected readonly numeroCommande = formatCommandeNumber;

  protected readonly form = this.#fb.nonNullable.group({
    commandeId: [''],
    motif: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void {
    const user = this.#auth.currentUser();
    if (!user) {
      this.erreur.set('Session introuvable.');
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      reclamations: this.#service.getByClient(user.id),
      commandes: this.#commandes.getByClient(user.id).pipe(catchError(() => of([] as Commande[]))),
    })
      .pipe(
        catchError(() => {
          this.erreur.set('Impossible de charger vos réclamations.');
          return of({ reclamations: [] as Reclamation[], commandes: [] as Commande[] });
        })
      )
      .subscribe(({ reclamations, commandes }) => {
        this.reclamations.set(reclamations);
        this.commandes.set(commandes);
        this.isLoading.set(false);
      });
  }

  protected basculerFormulaire(): void {
    this.formulaireOuvert.update(v => !v);
  }

  protected soumettre(): void {
    const user = this.#auth.currentUser();
    if (!user || this.enEnvoi()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.enEnvoi.set(true);

    this.#service
      .creer({
        clientId: user.id,
        commandeId: v.commandeId || undefined,
        motif: v.motif,
        description: v.description,
      })
      .subscribe({
        next: creee => {
          this.reclamations.update(liste => [creee, ...liste]);
          this.form.reset({ commandeId: '', motif: '', description: '' });
          this.formulaireOuvert.set(false);
          this.enEnvoi.set(false);
          this.#notifications.info('Réclamation enregistrée. Vous serez recontacté.');
        },
        error: () => {
          this.enEnvoi.set(false);
          this.erreur.set("L'envoi a échoué, réessayez.");
        },
      });
  }
}
