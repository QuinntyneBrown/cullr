import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RadioGroup } from './radio-group';

@Component({
  imports: [RadioGroup],
  template: `<cu-radio-group legend="Curate as" [options]="options" [(value)]="value" />`,
})
class Host {
  options = [
    { value: 'today', label: 'Best of today', description: 'Shown on Curated' },
    { value: 'week', label: 'Best of this week' },
  ];
  value = 'today';
}

describe('RadioGroup', () => {
  it('Given options, When rendered, Then native radios share a name inside a fieldset with a legend and the value is selected', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fieldset legend')?.textContent).toBe('Curate as');
    const radios = Array.from(el.querySelectorAll<HTMLInputElement>('label.choice input[type="radio"]'));
    expect(radios).toHaveLength(2);
    expect(new Set(radios.map((r) => r.name)).size).toBe(1);
    expect(radios.map((r) => r.checked)).toEqual([true, false]);
    expect(el.querySelector('.choice__text small')?.textContent).toBe('Shown on Curated');
  });

  it('Given the owner picks another option, When changed, Then the bound value updates', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    fixture.nativeElement.querySelectorAll('input')[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('week');
  });
});
