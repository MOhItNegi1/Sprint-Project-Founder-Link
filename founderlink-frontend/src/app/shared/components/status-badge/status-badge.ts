import { Component, input } from '@angular/core';
import { DisplayStatus } from '../../../core/models/portal.models';

@Component({
  selector: 'fl-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css'
})
export class StatusBadgeComponent {
  readonly status = input.required<DisplayStatus>();
}
