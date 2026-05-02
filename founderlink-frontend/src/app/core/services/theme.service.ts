import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

const THEME_KEY = 'founderlink.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly darkMode = signal(false);

  applyStoredPreference(): void {
    if (!this.isBrowser()) return;
    const stored = localStorage.getItem(THEME_KEY);
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkMode(dark);
  }

  toggle(): void {
    this.setDarkMode(!this.darkMode());
  }

  private setDarkMode(enabled: boolean): void {
    if (!this.isBrowser()) return;
    document.body.classList.toggle('dark', enabled);
    localStorage.setItem(THEME_KEY, enabled ? 'dark' : 'light');
    this.darkMode.set(enabled);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
