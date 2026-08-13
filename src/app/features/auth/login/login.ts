import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { PATHS, QUERY } from '../../../app.paths';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  readonly #auth = inject(Auth);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly registerPath = '/' + PATHS.register;

  readonly form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMsg.set(null);

    const { email, password } = this.form.getRawValue();
    this.#auth.login(email, password).subscribe({
      next: () => this.redirect(),
      error: () => {
        this.errorMsg.set('Email ou mot de passe incorrect');
        this.isLoading.set(false);
      },
    });
  }

  private redirect(): void {
    const returnUrl = this.#route.snapshot.queryParamMap.get(QUERY.returnUrl);
    if (returnUrl) {
      this.#router.navigateByUrl(returnUrl);
    } else if (this.#auth.role() === 'transporteur') {
      this.#router.navigate(['/' + PATHS.espaceTransporteur]);
    } else {
      this.#router.navigate(['/' + PATHS.trajets]);
    }
  }
}