import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { PATHS } from '../../../app.paths';
import { Role } from '../../../models/user.model';

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

  readonly form = this.#fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^7[05678][ ]?\d{3}[ ]?\d{2}[ ]?\d{2}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  setRole(role: Role): void {
    this.role.set(role);
  }

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { nom, email, telephone, password } = this.form.getRawValue();

    // Transporteur : inscription en 3 étapes (compte + entité + lien).
    // Client : inscription simple.
    const inscription$ =
      this.role() === 'transporteur'
        ? this.#auth.registerTransporteur({ nom, email, telephone, password })
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