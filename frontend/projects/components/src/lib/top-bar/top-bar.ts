import { Component } from '@angular/core';

@Component({
  selector: 'cu-top-bar',
  host: { style: 'display: contents' },
  template: '<header class="topbar"><ng-content /></header>',
})
export class TopBar {}
