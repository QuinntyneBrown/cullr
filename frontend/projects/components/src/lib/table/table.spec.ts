import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Table } from './table';

@Component({
  imports: [Table],
  template: `
    <cu-table caption="Ideas">
      <thead><tr><th scope="col">Idea</th></tr></thead>
      <tbody><tr><td>Porch Light</td></tr></tbody>
    </cu-table>
  `,
})
class Host {}

describe('Table', () => {
  it('Given head and body rows, When rendered, Then they sit in a captioned table inside the scroll wrapper', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.table-wrap > table.table > caption.visually-hidden')?.textContent).toBe('Ideas');
    expect(el.querySelector('table.table > thead th')?.textContent).toBe('Idea');
    expect(el.querySelector('table.table > tbody td')?.textContent).toBe('Porch Light');
  });
});
