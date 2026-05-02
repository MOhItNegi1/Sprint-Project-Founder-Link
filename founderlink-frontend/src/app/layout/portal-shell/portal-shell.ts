import { animate, style, transition, trigger } from '@angular/animations';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/models/portal.models';
import { ThemeService } from '../../core/services/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: Role[];
}

@Component({
  selector: 'fl-portal-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-shell.html',
  styleUrl: './portal-shell.css',
  animations: [
    trigger('routeFade', [
      transition('* <=> *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class PortalShellComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly menuOpen = signal(false);
  readonly nav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Startups', path: '/startups', icon: 'rocket_launch', roles: ['ROLE_FOUNDER', 'ROLE_INVESTOR', 'ROLE_ADMIN'] },
    { label: 'Investors', path: '/investors', icon: 'group', roles: ['ROLE_ADMIN'] },
    { label: 'Investments', path: '/investments', icon: 'payments', roles: ['ROLE_FOUNDER', 'ROLE_INVESTOR'] },
    { label: 'Profile', path: '/profile', icon: 'person' },
    { label: 'Notifications', path: '/notifications', icon: 'notifications' }
  ];

  canShow(item: NavItem): boolean {
    return !item.roles || this.auth.hasRole(item.roles);
  }

  initials(): string {
    return (this.auth.email() ?? 'U').slice(0, 2).toUpperCase();
  }
}
