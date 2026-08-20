import { ChangeDetectionStrategy, Component, inject, signal, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Trajets, TrajetPayload } from '../../../core/services/trajets';
import { Auth } from '../../../core/services/auth';
import { Trajet } from '../../../models/trajet.model';

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

  protected readonly form = this.fb.nonNullable.group({
    destination: ['', Validators.required],
    dateDepart: ['', Validators.required],
    prix: [0, [Validators.required, Validators.min(1)]],
    placesDisponibles: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    effect(() => {
      const t = this.trajet();
      if (t) {
        this.form.patchValue({
          destination: t.destination,
          dateDepart: t.dateDepart,
          prix: t.prix,
          placesDisponibles: t.placesDisponibles,
        });
      } else {
        this.form.reset({ destination: '', dateDepart: '', prix: 0, placesDisponibles: 0 });
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

    const transporteurId = this.auth.currentUser()?.transporteurId;
    if (!transporteurId) {
      this.erreur.set('Compte transporteur introuvable.');
      return;
    }

    const payload: TrajetPayload = {
      transporteurId,
      ...this.form.getRawValue(),
    };

    this.enEnvoi.set(true);
    const trajetActuel = this.trajet();

    const requete = trajetActuel
      ? this.trajetsService.modifier(trajetActuel.id, payload)
      : this.trajetsService.creer(payload);

    requete.subscribe({
      next: () => {
        this.enEnvoi.set(false);
        this.enregistre.emit();
      },
      error: () => {
        this.erreur.set('Enregistrement impossible.');
        this.enEnvoi.set(false);
      },
    });
  }
}