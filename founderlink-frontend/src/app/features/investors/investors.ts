import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { UserResponse } from '../../core/models/portal.models';
import { ApiService } from '../../core/services/api.service';
import { DataTableComponent } from '../../shared/components/data-table/data-table';

@Component({
  selector: 'fl-investors',
  standalone: true,
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './investors.html',
  styleUrl: './investors.css'
})
export class InvestorsComponent {
  private readonly api = inject(ApiService);
  readonly search = new FormControl('', { nonNullable: true });
  readonly query = toSignal(this.search.valueChanges.pipe(startWith(''), map((value) => value.toLowerCase())), { initialValue: '' });
  readonly users = toSignal(this.api.getUsers().pipe(catchError(() => of([] as UserResponse[]))), { initialValue: [] });
  readonly columns = [
    { key: 'userId', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'location', label: 'Location' },
    { key: 'companyName', label: 'Company' }
  ] as const;
  readonly filteredUsers = computed(() => {
    const query = this.query();
    return this.users().filter((user) => [user.name, user.email, user.role, user.location, user.companyName].join(' ').toLowerCase().includes(query));
  });
}
