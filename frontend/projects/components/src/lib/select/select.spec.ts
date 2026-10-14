import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Select } from './select';

@Component({
  imports: [Select],
  template: `<cu-select name="category" label="Category" [options]="options" [(value)]="value" [error]="error" />`,
})
class Host {
  options = ['Toronto & GTA', 'Photography'];
  value = 'Toronto & GTA';
  error = '';
}

describe('Select', () => {
  it('Given options, When rendered, Then a labelled native select shows the value', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const select = fixture.nativeElement.querySelector('label.field select.select') as HTMLSelectElement;
    expect(fixture.nativeElement.querySelector('.field__label').textContent).toBe('Category');
    expect(Array.from(select.options).map((o) => o.text)).toEqual(['Toronto & GTA', 'Photography']);
    expect(select.value).toBe('Toronto & GTA');
  });

  it('Given the owner chooses an option, When change fires, Then the bound value updates', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;

    select.value = 'Photography';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('Photography');
  });
});
