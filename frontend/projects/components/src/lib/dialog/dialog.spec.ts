import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Dialog } from './dialog';

@Component({
  imports: [Dialog],
  template: `
    <button id="opener" type="button">Open</button>
    @if (open()) {
      <cu-dialog title="Capture idea" description="Log a new idea." tone="danger" (closed)="closes = closes + 1">
        <input id="first" />
        <button id="second" type="button">Inside</button>
        <button footer id="last" type="button">Done</button>
      </cu-dialog>
    }
  `,
})
class Host {
  open = signal(true);
  closes = 0;
}

describe('Dialog', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    return fixture;
  };

  it('Given a dialog, When rendered, Then it is a labelled modal with title, description and tone icon', async () => {
    const fixture = await render();

    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('.dialog[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el.querySelector('#' + dialog.getAttribute('aria-labelledby'))?.textContent).toBe('Capture idea');
    expect(el.querySelector('#' + dialog.getAttribute('aria-describedby'))?.textContent).toBe('Log a new idea.');
    expect(el.querySelector('.dialog__icon--danger')).not.toBeNull();
    expect(el.querySelector('.backdrop')).not.toBeNull();
    expect(el.querySelector('.dialog__footer #last')).not.toBeNull();
  });

  it('Given a dialog opens, When rendered, Then focus moves to the first field and returns to the opener on close', async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector('#opener') as HTMLElement;
    opener.focus();

    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('first');

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('Given a dialog, When Escape or Close is used, Then it emits closed', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    el.querySelector('.dialog')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    (el.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click();

    expect(fixture.componentInstance.closes).toBe(2);
  });

  it('Given focus is on the last control, When Tab is pressed, Then focus wraps to the first', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('#last') as HTMLElement).focus();

    el.querySelector('.dialog')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close');
  });
});
