import { Component } from '@angular/core';

@Component({
  selector: '[cuCard]',
  host: { class: 'card' },
  template: '<ng-content />',
})
export class Card {}
