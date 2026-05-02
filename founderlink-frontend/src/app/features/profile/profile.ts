import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UserResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'fl-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly saved = signal(false);
  readonly user = signal<UserResponse | null>(null);
  readonly form = this.fb.nonNullable.group({
    skills: ['', Validators.maxLength(500)],
    experience: ['', Validators.maxLength(300)],
    bio: ['', Validators.maxLength(1000)],
    portfolioLinks: ['', Validators.maxLength(500)],
    location: ['', Validators.maxLength(200)],
    companyName: ['', Validators.maxLength(200)]
  });

  ngOnInit(): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this.api.getUser(userId).subscribe((user) => {
      this.user.set(user);
      this.form.patchValue({
        skills: user.skills ?? '',
        experience: user.experience ?? '',
        bio: user.bio ?? '',
        portfolioLinks: user.portfolioLinks ?? '',
        location: user.location ?? '',
        companyName: user.companyName ?? ''
      });
    });
  }

  save(): void {
    const userId = this.auth.userId();
    if (!userId || this.form.invalid) return;
    this.api.updateUser(userId, this.form.getRawValue()).subscribe((user) => {
      this.user.set(user);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2200);
    });
  }
}
