import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { PATHS } from '../../../app.paths';
import { Role } from '../../../models/user.model';
import { TypeTransporteur, ModeTransport } from '../../../models/transporteur.model';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  readonly #auth = inject(Auth);
  readonly #router = inject(Router);
  readonly #fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly role = signal<Role>('client');
  readonly loginPath = '/' + PATHS.login;

  // ÉVOLUTION FRET : type + modes du transporteur (décision 1)
  readonly typeTransporteur = signal<TypeTransporteur>('INFORMEL');
  readonly modesDisponibles: ModeTransport[] = ['ROUTE', 'BATEAU', 'AVION'];
  readonly modesChoisis = signal<ModeTransport[]>(['ROUTE']);

  readonly form = this.#fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^7[05678][ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  setRole(role: Role): void {
    this.role.set(role);
  }

  setType(type: TypeTransporteur): void {
    this.typeTransporteur.set(type);
    if (type === 'INFORMEL') this.modesChoisis.set(['ROUTE']);
  }

  toggleMode(mode: ModeTransport): void {
    this.modesChoisis.update(modes =>
      modes.includes(mode) ? modes.filter(m => m !== mode) : [...modes, mode]
    );
  }

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.role() === 'transporteur' && this.modesChoisis().length === 0) {
      this.errorMsg.set('Choisissez au moins un mode de transport.');
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { nom, email, telephone, password } = this.form.getRawValue();

    const inscription$ =
      this.role() === 'transporteur'
        ? this.#auth.registerTransporteur({
            nom, email, telephone, password,
            type: this.typeTransporteur(),
            modesTransport: this.modesChoisis(),
          })
        : this.#auth.register({ nom, email, telephone, password, role: 'client' });

    inscription$.subscribe({
      next: () => this.redirect(),
      error: err => {
        this.errorMsg.set(
          err.status === 400 && typeof err.error === 'string' && err.error.includes('already')
            ? 'Un compte existe déjà avec cet email'
            : "Impossible de créer le compte, réessayez"
        );
        this.isLoading.set(false);
      },
    });
  }

  private redirect(): void {
    this.#router.navigate([
      '/' + (this.role() === 'transporteur' ? PATHS.espaceTransporteur : PATHS.trajets),
    ]);
  }
}
