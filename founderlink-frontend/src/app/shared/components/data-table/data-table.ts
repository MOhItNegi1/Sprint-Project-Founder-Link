import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { TableColumn } from '../../../core/models/portal.models';
import { StatusBadgeComponent } from '../status-badge/status-badge';

@Component({
  selector: 'fl-data-table',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './data-table.html',
  styleUrl: './data-table.css'
})
export class DataTableComponent<T extends Record<string, unknown>> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();

  value(row: T, key: keyof T): unknown {
    return row[key];
  }
}
