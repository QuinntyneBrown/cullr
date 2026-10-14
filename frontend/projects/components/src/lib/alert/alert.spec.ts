import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Alert } from './alert';
import { Card } from '../card/card';
import { Skeleton } from '../skeleton/skeleton';

@Component({
  imports: [Alert, Card, Skeleton],
  template: `
    <div cuCard class="auth-card">Inside</div>
    <cu-alert title="Sign-in service is unreachable">Check your connection.</cu-alert>
    <cu-alert title="Fix 1 error to continue" [summary]="true"><ul><li>Enter your password</li></ul></cu-alert>
    <cu-skeleton variant="title" width="60%" />
    <cu-skeleton variant="control" />
  `,
})
class Host {}

describe('Card, Alert and Skeleton', () => {
  let el: HTMLElement;
  beforeEach(async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  it('Given a card attribute, When rendered, Then the element is a card and keeps its own classes', () => {
    expect(el.querySelector('div.card.auth-card')?.textContent).toBe('Inside');
  });

  it('Given an alert, When rendered, Then it is a danger alert announced as an alert with title and body', () => {
    const alert = el.querySelector('.alert.alert--danger') as HTMLElement;
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.querySelector('.alert__title')?.textContent).toBe('Sign-in service is unreachable');
    expect(alert.querySelector('.alert__body')?.textContent).toContain('Check your connection.');
    expect(alert.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('Given a summary alert, When rendered, Then it has the form-summary class', () => {
    expect(el.querySelectorAll('.alert.form-summary')).toHaveLength(1);
  });

  it('Given skeletons, When rendered, Then they use the skeleton classes and sizes', () => {
    const [title, control] = Array.from(el.querySelectorAll('.skeleton')) as HTMLElement[];
    expect(title.classList.contains('skeleton--title')).toBe(true);
    expect(title.style.width).toBe('60%');
    expect(control.style.height).toBe('var(--control-height-md)');
  });
});
