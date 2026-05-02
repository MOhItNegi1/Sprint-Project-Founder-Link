import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'fl-notifications',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  
  readonly showUnread = signal(false);
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly marking = signal<number | null>(null);
  
  readonly visibleNotifications = computed(() =>
    this.notifications().filter((item) => !this.showUnread() || !item.read)
  );

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    const userId = this.auth.userId();
    if (!userId) return;
    
    this.api.getNotifications(userId).subscribe({
      next: (data) => this.notifications.set(data),
      error: () => this.notifications.set([])
    });
  }

  markRead(id: number): void {
    this.marking.set(id);
    this.api.markNotificationAsRead(id).subscribe({
      next: () => {
        this.marking.set(null);
        this.loadNotifications();
      },
      error: () => {
        this.marking.set(null);
      }
    });
  }
}
