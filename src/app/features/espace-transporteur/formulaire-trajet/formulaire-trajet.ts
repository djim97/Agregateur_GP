import { ChangeDetectionStrategy, Component, inject, signal, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Trajets, TrajetPayload } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';
import { DEVISES, DEVISE_DEFAUT, CodeDevise } from '../../../models/devises';

@Component({
  selector: 'app-formulaire-trajet',
  imports: [ReactiveFormsModule],
  templateUrl: './formulaire-trajet.html',
  styleUrl: './formulaire-trajet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormulaireTrajet {
  private fb = inject(FormBuilder);
  private trajetsService = inject(Trajets);
  private auth = inject(Auth);

  trajet = input<Trajet | null>(null);
  annuler = output<void>();
  enregistre = output<void>();

  protected readonly enEnvoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly devises = DEVISES;

  // ÉVOLUTION FRET : capacité kg + prix/kg + plage de réception (remplace prix/places)
  protected readonly form = this.fb.nonNullable.group({
    destination: ['', Validators.required],
    dateDepart: ['', Validators.required],
    prixParKilo: [0, [Validators.required, Validators.min(0.01)]],
    devise: [DEVISE_DEFAUT as CodeDevise, Validators.required],
    capaciteKilosTotale: [0, [Validators.required, Validators.min(1)]],
    plageReceptionDebut: ['', Validators.required],
    plageReceptionFin: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      const t = this.trajet();
      if (t) {
        this.form.patchValue({
          destination: t.destination,
          dateDepart: t.dateDepart,
          prixParKilo: t.prixParKilo,
          devise: t.devise ?? DEVISE_DEFAUT,
          capaciteKilosTotale: t.capaciteKilosTotale,
          plageReceptionDebut: t.plageReception.debut,
          plageReceptionFin: t.plageReception.fin,
        });
      } else {
        this.form.reset({
          destination: '', dateDepart: '',
          prixParKilo: 0, devise: DEVISE_DEFAUT, capaciteKilosTotale: 0,
          plageReceptionDebut: '', plageReceptionFin: '',
        });
      }
    });
  }

  protected onAnnuler(): void {
    this.annuler.emit();
  }

  protected soumettre(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // La plage de réception doit se terminer avant le départ, et être cohérente
    if (v.plageReceptionFin <= v.plageReceptionDebut) {
      this.erreur.set('La fin de la plage de réception doit être après son début.');
      return;
    }
    if (v.plageReceptionFin > v.dateDepart) {
      this.erreur.set('La réception doit se terminer avant la date de départ.');
      return;
    }

    const transporteurId = this.auth.currentUser()?.transporteurId;
    if (!transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      return;
    }

    const payload: TrajetPayload = { transporteurId, ...v };

    this.enEnvoi.set(true);
    this.erreur.set(null);
    const trajetActuel = this.trajet();

    const requete = trajetActuel
      ? this.trajetsService.modifier(trajetActuel.id, payload, trajetActuel.kilosReserves, trajetActuel.complet)
      : this.trajetsService.creer(payload);

    requete.subscribe({
      next: () => {
        this.enEnvoi.set(false);
        this.enregistre.emit();
      },
      error: () => {
        this.enEnvoi.set(false);
        this.erreur.set("L'enregistrement a échoué, réessayez.");
      },
    });
  }
}
