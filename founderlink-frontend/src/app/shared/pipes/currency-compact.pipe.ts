import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyCompact', standalone: true })
export class CurrencyCompactPipe implements PipeTransform {
  transform(value: number | string): string {
    const amount = Number(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
}
