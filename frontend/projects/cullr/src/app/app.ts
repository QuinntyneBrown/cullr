import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogHost, ToastHost } from '@cullr/components';

@Component({
  imports: [RouterOutlet, ToastHost, ConfirmDialogHost],
  selector: 'app-root',
  template: '<router-outlet /><cu-toast-host /><cu-confirm-dialog-host />',
})
export class App {}
