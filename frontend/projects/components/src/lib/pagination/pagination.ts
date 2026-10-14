import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'cu-pagination',
  template: `
    <nav class="cluster cluster--between" aria-label="Pagination" style="margin-top: var(--space-4)">
      <span class="text-caption">Showing {{ first() }}–{{ last() }} of {{ total() }}</span>
      <ul class="pagination">
        <li>
          <button type="button" aria-label="Previous page" [attr.aria-disabled]="page() === 1" (click)="go(page() - 1)">‹</button>
        </li>
        @for (n of pages(); track n) {
          <li>
            <button type="button" [attr.aria-current]="n === page() ? 'page' : null" (click)="go(n)">{{ n }}</button>
          </li>
        }
        <li>
          <button type="button" aria-label="Next page" [attr.aria-disabled]="page() === pageCount()" (click)="go(page() + 1)">›</button>
        </li>
      </ul>
    </nav>
  `,
})
export class Pagination {
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly page = model(1);

  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected readonly first = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly last = computed(() => Math.min(this.total(), this.page() * this.pageSize()));
  protected readonly pages = computed(() => {
    const start = Math.max(1, Math.min(this.page() - 2, this.pageCount() - 4));
    const end = Math.min(this.pageCount(), start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.pageCount()) this.page.set(page);
  }
}
