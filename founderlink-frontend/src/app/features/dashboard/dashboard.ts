import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { catchError, combineLatest, map, of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { InvestmentResponse, StartupResponse, UserResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card';
import { RouterLink } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'fl-dashboard',
  standalone: true,
  imports: [AsyncPipe, StatCardComponent, DataTableComponent, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly api = inject(ApiService);
  readonly auth = inject(AuthService);
  private chart?: Chart;
  @ViewChild('fundingChart') fundingChart?: ElementRef<HTMLCanvasElement>;

  readonly startups$ = this.api.getStartups().pipe(catchError(() => of([] as StartupResponse[])));
  readonly investments$ = this.api.getMyInvestments().pipe(catchError(() => of([] as InvestmentResponse[])));
  readonly users$ = this.auth.isAdmin()
    ? this.api.getUsers().pipe(catchError(() => of([] as UserResponse[])))
    : of([] as UserResponse[]);

  readonly stats$ = combineLatest([this.startups$, this.investments$, this.users$]).pipe(
    map(([startups, investments, users]) => {
      if (this.auth.isAdmin()) {
        return [
          { label: 'Total Users', value: String(users.length), change: 'Registered users', tone: 'blue' as const },
          { label: 'Pending Queue', value: String(startups.filter(s => s.approvalStatus === 'PENDING').length), change: 'Awaiting review', tone: 'amber' as const },
          { label: 'Platform Revenue', value: this.currency(0), change: 'To date', tone: 'green' as const },
          { label: 'Flags', value: '0', change: 'Suspended accounts', tone: 'purple' as const }
        ];
      }
      if (this.auth.isFounder()) {
        const myStartups = startups.filter(s => s.founderId === this.auth.userId());
        const pending = myStartups.filter(s => s.approvalStatus === 'PENDING');
        const capitalReq = myStartups.reduce((sum, item) => sum + (item.fundingGoal ?? 0), 0);
        return [
          { label: 'My Startups', value: String(myStartups.length), change: 'Active projects', tone: 'blue' as const },
          { label: 'Pending', value: String(pending.length), change: 'Awaiting approval', tone: 'amber' as const },
          { label: 'Capital Requested', value: this.currency(capitalReq), change: 'Target goal', tone: 'green' as const },
          { label: 'Requests In', value: '0', change: 'Investment requests', tone: 'purple' as const }
        ];
      }

      // Investor
      const approved = startups.filter(s => s.approvalStatus === 'APPROVED');
      const deployed = investments.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
      return [
        { label: 'My Investments', value: String(investments.length), change: 'Active portfolio', tone: 'blue' as const },
        { label: 'Capital Deployed', value: this.currency(deployed), change: 'Total invested', tone: 'green' as const },
        { label: 'Browse Startups', value: String(approved.length), change: 'Approved startups', tone: 'purple' as const },
        { label: 'Watchlist', value: '0', change: 'Saved startups', tone: 'amber' as const }
      ];
    })
  );

  readonly tableData$ = combineLatest([this.startups$, this.investments$]).pipe(
    map(([startups, investments]) => {
      if (this.auth.isAdmin()) return startups.filter(s => s.approvalStatus === 'PENDING').slice(0, 6);
      if (this.auth.isFounder()) return startups.filter(s => s.founderId === this.auth.userId()).slice(0, 6);
      const investedIds = new Set(investments.map(i => i.startupId));
      return startups.filter(s => investedIds.has(s.startupId)).slice(0, 6);
    })
  );

  readonly startupColumns = [
    { key: 'startupName', label: 'Startup' },
    { key: 'industry', label: 'Industry' },
    { key: 'stage', label: 'Stage' },
    { key: 'fundingGoal', label: 'Funding Goal', type: 'currency' },
    { key: 'approvalStatus', label: 'Status', type: 'status' }
  ] as const;

  ngAfterViewInit(): void {
    combineLatest([this.startups$, this.investments$, this.users$]).subscribe(([startups, investments, users]) => {
      const canvas = this.fundingChart?.nativeElement;
      if (!canvas) return;

      this.chart?.destroy();

      let labels: string[] = [];
      let data: number[] = [];
      let chartType: 'bar' | 'doughnut' | 'line' = 'bar';

      // ROLE LOGIC
      if (this.auth.isAdmin()) {
        labels = ['Startups', 'Users', 'Investments'];
        data = [startups.length, users.length, investments.length];
        chartType = 'line';

      } else if (this.auth.isFounder()) {
        const myStartups = startups.filter(s => s.founderId === this.auth.userId());

        labels = ['Total Startups', 'Pending', 'Approved'];
        data = [
          myStartups.length,
          myStartups.filter(s => s.approvalStatus === 'PENDING').length,
          myStartups.filter(s => s.approvalStatus === 'APPROVED').length
        ];

        chartType = 'bar';

      } else if (this.auth.isInvestor()) {
        const investedIds = new Set(investments.map(i => i.startupId));
        const portfolio = startups.filter(s => investedIds.has(s.startupId));

        const bySector = portfolio.reduce((acc, s) => {
          const sec = s.industry || 'Other';
          acc[sec] = (acc[sec] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        labels = Object.keys(bySector);
        data = Object.values(bySector);
        chartType = 'doughnut';

        if (labels.length === 0) {
          labels = ['Tech', 'Health', 'Finance'];
          data = [0, 0, 0];
        }
      }

      // ✅ CREATE CHART HERE (ONLY ONCE)
      this.chart = new Chart(canvas, {
        type: chartType,
        data: {
          labels,
          datasets: [{
            label: 'Records',
            data,
            backgroundColor: ['#006a61', '#131b2e', '#86f2e4', '#b7791f', '#ba1a1a'],
            borderColor: chartType === 'line' ? '#006a61' : undefined,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: chartType === 'doughnut' } },
          scales: chartType === 'doughnut'
            ? undefined
            : { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });

    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  tableTitle(): string {
    if (this.auth.isAdmin()) return 'Pending Approvals Queue';
    if (this.auth.isFounder()) return 'My Startups Pipeline';
    if (this.auth.isInvestor()) return 'Startups I\'ve Invested In';
    return 'Startup Pipeline';
  }

  chartTitle(): string {
    if (this.auth.isAdmin()) return 'Startups & Users Over Time';
    if (this.auth.isFounder()) return 'Investment Requests Over Time';
    if (this.auth.isInvestor()) return 'Portfolio Value by Sector';
    return 'Workspace Records';
  }

  ctaLink(): string {
    if (this.auth.isAdmin()) return '/startups';
    if (this.auth.isFounder()) return '/startups';
    if (this.auth.isInvestor()) return '/investors';
    return '/';
  }

  ctaText(): string {
    if (this.auth.isAdmin()) return 'Review Pending Startups';
    if (this.auth.isFounder()) return '+ Create New Startup';
    if (this.auth.isInvestor()) return 'Browse / Invest in Startups';
    return 'Explore Platform';
  }

  title(): string {
    if (this.auth.isAdmin()) return 'Admin Dashboard';
    if (this.auth.isFounder()) return 'Founder Dashboard';
    if (this.auth.isInvestor()) return 'Investor Dashboard';
    return 'Dashboard';
  }

  subtitle(): string {
    if (this.auth.isAdmin()) return 'Review platform records and manage startup approvals.';
    if (this.auth.isFounder()) return 'Create startups and manage incoming investment requests.';
    if (this.auth.isInvestor()) return 'Discover approved startups and track your investments.';
    return 'Your Founder Link workspace.';
  }

  private currency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(amount);
  }
}
