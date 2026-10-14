import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Textarea } from './textarea';

@Component({
  imports: [Textarea],
  template: `<cu-textarea name="summary" label="Summary" [maxlength]="10" [(value)]="value" />`,
})
class Host {
  value = 'abc';
}

describe('Textarea', () => {
  it('Given a limit, When rendered, Then a labelled textarea shows the value, the limit and a counter', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const textarea = el.querySelector('label.field textarea.textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('abc');
    expect(textarea.maxLength).toBe(10);
    expect(el.querySelector('.field__counter')?.textContent).toBe('3 / 10');
  });

  it('Given the owner types, When input fires, Then the bound value and counter update', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'abcdef';
    textarea.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.value).toBe('abcdef');
    expect(fixture.nativeElement.querySelector('.field__counter').textContent).toBe('6 / 10');
  });
});
