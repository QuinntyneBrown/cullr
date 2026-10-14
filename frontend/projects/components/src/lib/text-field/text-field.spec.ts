import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TextField } from './text-field';

@Component({
  imports: [TextField],
  template: `<cu-text-field name="email" label="Email" type="email" [(value)]="email" [error]="error" [readonly]="readonly" />`,
})
class Host {
  email = 'a@b.co';
  error = '';
  readonly = false;
}

describe('TextField', () => {
  const render = async (setup: (host: Host) => void = () => {}) => {
    const fixture = TestBed.createComponent(Host);
    setup(fixture.componentInstance);
    await fixture.whenStable();
    return fixture;
  };

  it('Given a label and value, When rendered, Then a labelled input shows the value', async () => {
    const fixture = await render();

    const input = fixture.nativeElement.querySelector('label.field input.input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('.field__label').textContent).toBe('Email');
    expect(input.id).toBe('email');
    expect(input.type).toBe('email');
    expect(input.value).toBe('a@b.co');
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('Given the owner types, When input fires, Then the bound value updates', async () => {
    const fixture = await render();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'new@b.co';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.email).toBe('new@b.co');
  });

  it('Given an error, When rendered, Then the input is invalid and described by the error message', async () => {
    const fixture = await render((host) => (host.error = 'Enter your email'));

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const error = fixture.nativeElement.querySelector('.field__error') as HTMLElement;
    expect(error.textContent).toBe('Enter your email');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('Given readonly, When rendered, Then the input cannot be edited', async () => {
    const fixture = await render((host) => (host.readonly = true));

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).readOnly).toBe(true);
  });
});
