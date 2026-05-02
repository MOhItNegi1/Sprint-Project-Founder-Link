import { Routes } from '@angular/router';
import { authGuard, publicOnlyGuard, roleGuard } from './core/guards/auth.guard';
import { PortalShellComponent } from './layout/portal-shell/portal-shell';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent)
  },
  {
    path: 'login',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [publicOnlyGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.RegisterComponent)
  },
  {
    path: '',
    component: PortalShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent) },
      { path: 'startups', canActivate: [roleGuard(['ROLE_FOUNDER', 'ROLE_INVESTOR', 'ROLE_ADMIN'])], loadComponent: () => import('./features/startups/startups').then((m) => m.StartupsComponent) },
      { path: 'investors', canActivate: [roleGuard(['ROLE_ADMIN'])], loadComponent: () => import('./features/investors/investors').then((m) => m.InvestorsComponent) },
      { path: 'investments', canActivate: [roleGuard(['ROLE_FOUNDER', 'ROLE_INVESTOR'])], loadComponent: () => import('./features/investments/investments').then((m) => m.InvestmentsComponent) },
      { path: 'profile', loadComponent: () => import('./features/profile/profile').then((m) => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications').then((m) => m.NotificationsComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
