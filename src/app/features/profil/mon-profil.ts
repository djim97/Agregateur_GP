import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profil } from '../../core/services/profil';
import { Auth } from '../../core/services/auth';
import { Notifications } from '../../core/services/notifications';
import { Transporteur, ModeTransport } from '../../models/transporteur.model';
import { DEVISES, DEVISE_DEFAUT } from '../../models/devises';
import { AvisService } from '../../core/services/avis';
import { Avis, moyenneAvis } from '../../models/avis.model';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Spinner } from '../../shared/components/spinner/spinner';

/**
 * Profil unique pour les deux rôles.
 * Client       : nom, téléphone, mot de passe.
 * Transporteur : idem + coordonnées publiques (email, adresse, service client, zones).
 * Le TYPE et le NINEA ne sont pas modifiables (figés à l'inscription).
 */
@Component({
  selector: 'app-mon-profil',
  imports: [ReactiveFormsModule, Spinner],
  templateUrl: './mon-profil.html',
  styleUrl: './mon-profil.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonProfil implements OnInit {
  readonly #fb = inject(FormBuilder);
  readonly #profil = inject(Profil);
  readonly #auth = inject(Auth);
  readonly #notifications = inject(Notifications);
  readonly #avisService = inject(AvisService);

  protected readonly isLoading = signal(true);
  protected readonly enEnvoi = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly transporteur = signal<Transporteur | null>(null);

  /** Avis reçus par ce compte (client noté par des transporteurs) */
  protected readonly avisRecus = signal<Avis[]>([]);
  protected readonly noteRecue = computed(() => moyenneAvis(this.avisRecus()));
  protected readonly etoiles = [1, 2, 3, 4, 5];

  protected readonly estTransporteur = computed(() => this.#auth.role() === 'transporteur');
  protected readonly email = computed(() => this.#auth.currentUser()?.email ?? '');

  protected readonly modesDisponibles: ModeTransport[] = ['ROUTE', 'BATEAU', 'AVION'];
  protected readonly devises = DEVISES;

  protected readonly formCompte = this.#fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    telephone: ['', [Validators.required, Validators.pattern(/^7[05678][ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$/)]],
    password: [''],
    confirmation: [''],
  });

  protected readonly formTransporteur = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    adresse: ['', Validators.required],
    serviceClient: [''],
    zones: [''],   // saisie libre séparée par des virgules
    deviseReference: [DEVISE_DEFAUT as string, Validators.required],
  });

  ngOnInit(): void {
    const user = this.#auth.currentUser();
    if (!user) {
      this.erreur.set('Session introuvable.');
      this.isLoading.set(false);
      return;
    }

    this.formCompte.patchValue({
      nom: user.nom,
      telephone: (user as { telephone?: string }).telephone ?? '',
    });

    if (user.role === 'client') {
      this.#avisService
        .getSurClient(user.id)
        .pipe(catchError(() => of([] as Avis[])))
        .subscribe(avis => this.avisRecus.set(avis));
    }

    if (user.role === 'transporteur' && user.transporteurId) {
      this.#profil.getTransporteur(user.transporteurId).subscribe({
        next: t => {
          this.transporteur.set(t);
          this.formCompte.patchValue({ telephone: t.telephone });
          this.formTransporteur.patchValue({
            email: t.email ?? user.email,
            adresse: t.adresse ?? '',
            serviceClient: t.serviceClient ?? '',
            zones: (t.zonesDesservies ?? []).join(', '),
            deviseReference: t.deviseReference ?? DEVISE_DEFAUT,
          });
          this.isLoading.set(false);
        },
        error: () => {
          this.erreur.set('Impossible de charger votre fiche transporteur.');
          this.isLoading.set(false);
        },
      });
    } else {
      this.isLoading.set(false);
    }
  }

  protected enregistrer(): void {
    const user = this.#auth.currentUser();
    if (!user || this.enEnvoi()) return;

    if (this.formCompte.invalid) {
      this.formCompte.markAllAsTouched();
      return;
    }

    const c = this.formCompte.getRawValue();

    if (c.password && c.password.length < 6) {
      this.erreur.set('Le mot de passe doit faire 6 caractères minimum.');
      return;
    }
    if (c.password !== c.confirmation) {
      this.erreur.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    const compte = {
      nom: c.nom,
      telephone: c.telephone,
      ...(c.password ? { password: c.password } : {}),
    };

    this.erreur.set(null);
    this.enEnvoi.set(true);

    if (this.estTransporteur() && user.transporteurId) {
      if (this.formTransporteur.invalid) {
        this.formTransporteur.markAllAsTouched();
        this.enEnvoi.set(false);
        return;
      }
      const t = this.formTransporteur.getRawValue();
      const majT = {
        email: t.email,
        adresse: t.adresse,
        serviceClient: t.serviceClient || undefined,
        zonesDesservies: t.zones.split(',').map(z => z.trim()).filter(Boolean),
        telephone: c.telephone,
        deviseReference: t.deviseReference,
      };
      this.#profil
        .majProfilTransporteur(user.id, user.transporteurId, compte, majT)
        .subscribe({
          next: maj => {
            this.transporteur.set(maj);
            this.terminer();
          },
          error: () => this.echec(),
        });
    } else {
      this.#profil.majCompte(user.id, compte).subscribe({
        next: () => this.terminer(),
        error: () => this.echec(),
      });
    }
  }

  private terminer(): void {
    this.enEnvoi.set(false);
    this.formCompte.patchValue({ password: '', confirmation: '' });
    this.#notifications.info('Profil mis à jour.');
  }

  private echec(): void {
    this.enEnvoi.set(false);
    this.erreur.set("L'enregistrement a échoué, réessayez.");
  }
}
