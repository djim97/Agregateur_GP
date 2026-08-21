import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder, ReactiveFormsModule, Validators,
  AbstractControl, ValidationErrors, ValidatorFn,
} from '@angular/forms';
import { Rendezvous } from '../../../core/services/rendezvous';
import { Commande } from '../../../models/commande.model';
import { Trajet } from '../../../models/trajet.model';
import { formatDateHeure } from '../../../shared/utils/date-format';
import { switchMap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { EtapeTimeline, EtatEtape } from '../../../shared/components/etape-timeline/etape-timeline';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EtatVide } from '../../../shared/components/etat-vide/etat-vide';
import { PATHS, QUERY } from '../../../app.paths';
import { formatCommandeNumber } from '../../../shared/utils/commande-number';
import { Notifications } from '../../../core/services/notifications';

const API = 'http://localhost:3000';

@Component({
  selector: 'app-nouveau-rdv',
  imports: [ReactiveFormsModule, EtapeTimeline, Spinner, EtatVide, RouterLink],
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
  private notifications = inject(Notifications);

  protected readonly retourCommandes = '/' + PATHS.mesCommandes;
  protected readonly commandeId = signal<string | null>(null);
  protected readonly commande = signal<Commande | null>(null);
  /** Trajet de la commande : porte la plage de réception du transporteur */
  protected readonly trajet = signal<Trajet | null>(null);
  protected readonly dateHeureLisible = formatDateHeure;

  /** Bornes du dépôt, au format attendu par un champ datetime-local */
  protected readonly bornes = computed(() => {
    const t = this.trajet();
    if (!t?.plageReception) return null;
    return { min: t.plageReception.debut, max: t.plageReception.fin };
  });

  /** La plage est-elle déjà passée ? */
  protected readonly plageDepassee = computed(() => {
    const b = this.bornes();
    return b ? new Date(b.max).getTime() < Date.now() : false;
  });
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

  private dateFuturValidator(control: AbstractControl): ValidationErrors | null {
    const valeur = control.value as string;
    if (!valeur) return null;
    return new Date(valeur).getTime() > Date.now() ? null : { datePassee: true };
  }

  /**
   * Le rendez-vous doit tomber DANS la plage de réception fixée par le
   * transporteur : c'est la fenêtre pendant laquelle il accepte les dépôts.
   * Le validateur est posé après le chargement du trajet, puisqu'il
   * dépend de ses bornes.
   */
  private validateurPlage(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const b = this.bornes();
      const valeur = control.value as string;
      if (!valeur || !b) return null;
      const saisie = new Date(valeur).getTime();
      if (saisie < new Date(b.min).getTime()) return { avantPlage: true };
      if (saisie > new Date(b.max).getTime()) return { apresPlage: true };
      return null;
    };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.queryParamMap.get(QUERY.commandeId);

    if (!id) {
      this.isLoading.set(false);
      this.erreurChargement.set(true);
      return;
    }

    this.commandeId.set(id);

    this.http.get<Commande>(`${API}/commandes/${id}`).pipe(
      switchMap(c => {
        this.commande.set(c);
        return forkJoin({
          commande: of(c),
          trajet: this.http.get<Trajet>(`${API}/trajets/${c.trajetId}`),
        });
      })
    ).subscribe({
      next: ({ trajet }) => {
        this.trajet.set(trajet);
        // Le validateur de plage ne peut être posé qu'une fois les bornes connues
        this.form.controls.dateHeure.addValidators(this.validateurPlage());
        this.form.controls.dateHeure.updateValueAndValidity();
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
        this.notifications.info('Rendez-vous confirmé et transmis au transporteur.');
        this.router.navigate(['/' + PATHS.mesCommandes]);
      },
      error: () => {
        this.enEnvoi.set(false);
      },
    });
  }
}