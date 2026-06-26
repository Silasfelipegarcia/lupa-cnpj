import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CookieConsentComponent],
  template: `
    <router-outlet />
    <app-cookie-consent />
  `,
  styles: [':host { display: block; }']
})
export class AppComponent {}
