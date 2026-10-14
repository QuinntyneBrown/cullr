import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Checkbox } from './checkbox';

@Component({
  imports: [Checkbox],
  template: `
    <cu-checkbox label="Notify me" [(checked)]="on" />
    <cu-checkbox label="Select Porch Light" [labelHidden]="true" />
  `,
})
class Host {
  on = false;
}

describe('Checkbox', () => {
  it('Given a label, When rendered, Then a native checkbox sits inside a choice label', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const first = el.querySelector('label.choice') as HTMLElement;
    expect(first.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(first.querySelector('.choice__text')?.textContent).toBe('Notify me');
  });

  it('Given the owner ticks it, When changed, Then the bound value updates', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.on).toBe(true);
  });

  it('Given a hidden label, When rendered, Then the label stays available to assistive technology only', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const text = fixture.nativeElement.querySelectorAll('.choice__text')[1] as HTMLElement;
    expect(text.textContent).toBe('Select Porch Light');
    expect(text.classList.contains('visually-hidden')).toBe(true);
  });
});
