import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { StartupResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';
import { CurrencyCompactPipe } from '../../shared/pipes/currency-compact.pipe';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'fl-startups',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyCompactPipe, StatusBadgeComponent],
  templateUrl: './startups.html',
  styleUrl: './startups.css'
})
export class StartupsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  
  readonly status = signal('All');
  readonly message = signal('');
  readonly search = this.fb.nonNullable.control('');
  readonly investmentAmount = this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]);

  readonly startupForm = this.fb.nonNullable.group({
    startupName: ['', Validators.required],
    description: ['', Validators.required],
    industry: [''],
    problemStatement: [''],
    solution: [''],
    fundingGoal: [0, [Validators.required, Validators.min(1)]],
    stage: ['IDEA' as const, Validators.required],
    location: ['']
  });

  readonly query = toSignal(this.search.valueChanges.pipe(startWith(''), map((value) => value.toLowerCase())), { initialValue: '' });
  
  // Simplified data loading
  readonly startups = signal<StartupResponse[]>([]);

  readonly visibleStartups = computed(() => {
    const query = this.query();
    const status = this.status();
    return this.startups().filter((startup) => {
      const allowedForInvestor = !this.auth.isInvestor() || startup.approvalStatus === 'APPROVED';
      const matchesStatus = status === 'All' || startup.approvalStatus === status;
      const matchesQuery = [startup.startupName, startup.industry, startup.location, startup.description].join(' ').toLowerCase().includes(query);
      return allowedForInvestor && matchesStatus && matchesQuery;
    });
  });

  ngOnInit() {
    this.loadStartups();
  }

  loadStartups() {
    this.api.getStartups().subscribe({
      next: (data) => this.startups.set(data),
      error: () => this.startups.set([])
    });
  }

  createStartup(): void {
    if (this.startupForm.invalid) {
      this.startupForm.markAllAsTouched();
      return;
    }
    this.api.createStartup(this.startupForm.getRawValue()).subscribe({
      next: () => {
        this.message.set('Startup created and sent for approval.');
        this.startupForm.reset({ startupName: '', description: '', industry: '', problemStatement: '', solution: '', fundingGoal: 0, stage: 'IDEA', location: '' });
        this.loadStartups();
      },
      error: () => this.message.set('Startup creation failed.')
    });
  }

  approve(id: number): void {
    this.api.approveStartup(id).subscribe(() => this.loadStartups());
  }

  reject(id: number): void {
    this.api.rejectStartup(id).subscribe(() => this.loadStartups());
  }

  invest(startupId: number): void {
    if (this.investmentAmount.invalid) return;
    this.api.createInvestment({ startupId, amount: this.investmentAmount.value }).subscribe({
      next: () => this.message.set('Investment request created.'),
      error: () => this.message.set('Investment request failed.')
    });
  }
}
