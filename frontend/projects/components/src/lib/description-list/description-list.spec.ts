import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DescriptionList } from './description-list';

@Component({
  imports: [DescriptionList],
  template: `<cu-description-list [items]="[{ term: 'Strengths', description: 'Real need' }, { term: 'Risks', description: 'Trust' }]" />`,
})
class Host {}

describe('DescriptionList', () => {
  it('Given term and description pairs, When rendered, Then they are a dl of dt and dd', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(Array.from(el.querySelectorAll('dl.dl > dt')).map((e) => e.textContent)).toEqual(['Strengths', 'Risks']);
    expect(Array.from(el.querySelectorAll('dl.dl > dd')).map((e) => e.textContent)).toEqual(['Real need', 'Trust']);
  });
});
