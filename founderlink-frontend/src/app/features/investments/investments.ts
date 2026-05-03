import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { InvestmentResponse, StartupResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table';

@Component({
  selector: 'fl-investments',
  standalone: true,
  imports: [CurrencyPipe, DataTableComponent],
  templateUrl: './investments.html',
  styleUrl: './investments.css'
})
export class InvestmentsComponent {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  readonly reload = signal(0);
  readonly status = signal('All');
  readonly investments = toSignal(
    toObservable(this.reload).pipe(switchMap(() => this.loadInvestments())),
    { initialValue: [] as InvestmentResponse[] }
  );
  readonly columns = [
    { key: 'investmentId', label: 'Investment ID' },
    { key: 'startupName', label: 'Startup' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'createdAt', label: 'Created', type: 'date' },
    { key: 'status', label: 'Status', type: 'status' }
  ] as const;
  readonly filteredInvestments = computed(() => {
    const status = this.status();
    return this.investments().filter((investment) => status === 'All' || investment.status === status);
  });

  approve(id: number): void {
    this.api.approveInvestment(id).subscribe(() => this.reload.update((value) => value + 1));
  }

  reject(id: number): void {
    this.api.rejectInvestment(id).subscribe(() => this.reload.update((value) => value + 1));
  }

  complete(id: number): void {
    this.api.completeInvestment(id).subscribe(() => this.reload.update((value) => value + 1));
  }

  private loadInvestments() {
    if (this.auth.isInvestor()) {
      return this.api.getMyInvestments().pipe(catchError(() => of([] as InvestmentResponse[])));
    }

    if (this.auth.isFounder()) {
      const userId = this.auth.userId();
      return this.api.getStartups().pipe(
        map((startups) => startups.filter((startup: StartupResponse) => startup.founderId === userId)),
        switchMap((startups) => {
          if (!startups.length) return of([] as InvestmentResponse[]);
          return forkJoin(startups.map((startup) => this.api.getInvestmentsByStartup(startup.startupId).pipe(catchError(() => of([] as InvestmentResponse[]))))).pipe(
            map((groups) => groups.flat())
          );
        }),
        catchError(() => of([] as InvestmentResponse[]))
      );
    }

    return of([] as InvestmentResponse[]);
  }
}
