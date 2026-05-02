import { Component, input } from '@angular/core';
import { StatCard } from '../../../core/models/portal.models';

@Component({
  selector: 'fl-stat-card',
  standalone: true,
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css'
})
export class StatCardComponent {
  readonly card = input.required<StatCard>();
}
