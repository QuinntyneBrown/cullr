import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <cu-button variant="primary" [block]="true" [busy]="busy" type="submit">Sign in</cu-button>
    <cu-button variant="link" routerLink="/forgot-password">Forgot?</cu-button>
  `,
})
class Host {
  busy = false;
}

describe('Button', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('Given a primary block submit button, When rendered, Then it carries the design-system classes and type', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect([...button.classList].sort()).toEqual(['btn', 'btn--block', 'btn--primary']);
    expect(button.type).toBe('submit');
    expect(button.getAttribute('aria-busy')).toBeNull();
    expect(button.textContent?.trim()).toBe('Sign in');
  });

  it('Given it is busy, When rendered, Then it is aria-busy and cannot be pressed again', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.busy = true;
    await fixture.whenStable();
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
  });

  it('Given a routerLink, When rendered, Then it is a link styled as a button', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(link.className).toBe('btn btn--link');
  });
});
