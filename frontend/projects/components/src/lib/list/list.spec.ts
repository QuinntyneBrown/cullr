import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { List } from './list';

@Component({
  imports: [List],
  template: `<cu-list [items]="[{ title: 'Building', meta: 'Today, 8:15 am' }, { title: 'Logged', meta: 'Today, 7:42 am' }]" />`,
})
class Host {}

describe('List', () => {
  it('Given items, When rendered, Then each is a list item with a title and meta line', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('ul.list > li.list__item')).toHaveLength(2);
    expect(el.querySelector('.list__body > .list__title')?.textContent).toBe('Building');
    expect(el.querySelector('.list__body > .list__meta')?.textContent).toBe('Today, 8:15 am');
  });
});
