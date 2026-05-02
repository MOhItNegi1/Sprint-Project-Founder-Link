import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Role } from '../../../core/models/portal.models';

@Component({
  selector: 'fl-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles: Array<{ label: string; value: Exclude<Role, 'ROLE_ADMIN' | 'ROLE_USER'>; icon: string }> = [
    { label: 'Founder', value: 'ROLE_FOUNDER', icon: 'rocket_launch' },
    { label: 'Investor', value: 'ROLE_INVESTOR', icon: 'account_balance' }
  ];
  readonly loading = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['ROLE_FOUNDER' as Exclude<Role, 'ROLE_ADMIN' | 'ROLE_USER'>, Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/login'),
      complete: () => this.loading.set(false)
    });
  }
}
