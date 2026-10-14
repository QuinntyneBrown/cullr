import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TopBar } from './top-bar';

@Component({
  imports: [TopBar],
  template: `<cu-top-bar><a class="topbar__brand" href="/">Cullr</a></cu-top-bar>`,
})
class Host {}

describe('TopBar', () => {
  it('Given projected brand content, When rendered, Then it is the page banner holding the brand', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const header = fixture.nativeElement.querySelector('header.topbar') as HTMLElement;
    expect(header.querySelector('a.topbar__brand')?.textContent).toBe('Cullr');
  });
});
