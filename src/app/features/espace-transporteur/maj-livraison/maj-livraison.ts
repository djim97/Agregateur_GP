import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Livraisons } from '../../../core/services/livraisons';
import { Livraison } from '../../../models/livraison.model';
import { Spinner } from '../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-maj-livraison',
  imports: [ReactiveFormsModule, Spinner],
  templateUrl: './maj-livraison.html',
  styleUrl: './maj-livraison.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MajLivraison implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private livraisonsService = inject(Livraisons);

  protected readonly livraisonId = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly enEnvoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    statut: this.fb.nonNullable.control<Livraison['statut']>('EN_ATTENTE', Validators.required),
    positionActuelle: ['', Validators.required],
    dateEstimee: ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.erreur.set('Livraison introuvable.');
      this.isLoading.set(false);
      return;
    }
    this.livraisonId.set(id);
    this.livraisonsService.getById(id).subscribe({
      next: (l) => {
        this.form.patchValue({
          statut: l.statut,
          positionActuelle: l.positionActuelle,
          dateEstimee: l.dateEstimee,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.erreur.set('Livraison introuvable.');
        this.isLoading.set(false);
      },
    });
  }

  protected retour(): void {
    this.router.navigate(['/espace-transporteur/commandes']);
  }

  protected soumettre(): void {
    if (this.form.invalid || !this.livraisonId()) {
      this.form.markAllAsTouched();
      return;
    }
    this.enEnvoi.set(true);
    this.livraisonsService.update(this.livraisonId()!, this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/espace-transporteur/commandes']),
      error: () => {
        this.erreur.set('Mise à jour impossible.');
        this.enEnvoi.set(false);
      },
    });
  }
}