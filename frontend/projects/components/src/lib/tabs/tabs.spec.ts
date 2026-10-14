import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tabs, TabItem } from './tabs';

@Component({ imports: [Tabs], template: `<cu-tabs label="Idea status" [items]="items" [(value)]="value" />` })
class Host {
  items: TabItem[] = [
    { value: 'All', label: 'All', count: 214 },
    { value: 'Logged', label: 'Logged' },
    { value: 'Building', label: 'Building' },
  ];
  value = 'All';
}

describe('Tabs', () => {
  const tabs = (fixture: { nativeElement: HTMLElement }) =>
    Array.from(fixture.nativeElement.querySelectorAll('button[role="tab"]')) as HTMLButtonElement[];

  it('Given a selected tab, When rendered, Then the tablist exposes aria-selected, roving tabindex and counts', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="tablist"]').getAttribute('aria-label')).toBe('Idea status');
    expect(tabs(fixture).map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs(fixture).map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    expect(tabs(fixture)[0].querySelector('.badge')?.textContent).toBe('214');
  });

  it('Given a tab is clicked, When selected, Then the bound value changes', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    tabs(fixture)[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('Logged');
    expect(tabs(fixture)[1].getAttribute('aria-selected')).toBe('true');
  });

  it('Given focus is on a tab, When arrow and Home/End keys are pressed, Then selection moves like a tablist', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const press = async (key: string) => {
      tabs(fixture)[fixture.componentInstance.items.findIndex((i) => i.value === fixture.componentInstance.value)].dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      );
      await fixture.whenStable();
    };

    await press('ArrowRight');
    expect(fixture.componentInstance.value).toBe('Logged');
    await press('End');
    expect(fixture.componentInstance.value).toBe('Building');
    await press('ArrowRight');
    expect(fixture.componentInstance.value).toBe('All');
    await press('ArrowLeft');
    expect(fixture.componentInstance.value).toBe('Building');
    await press('Home');
    expect(fixture.componentInstance.value).toBe('All');
  });
});
