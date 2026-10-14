import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chip } from './chip';

@Component({ imports: [Chip], template: `<cu-chip [(pressed)]="on">Photography</cu-chip>` })
class Host {
  on = false;
}

describe('Chip', () => {
  it('Given a chip, When rendered and toggled, Then it exposes aria-pressed and updates the bound state', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button.chip') as HTMLButtonElement;

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toBe('Photography');

    button.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.on).toBe(true);
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });
});
