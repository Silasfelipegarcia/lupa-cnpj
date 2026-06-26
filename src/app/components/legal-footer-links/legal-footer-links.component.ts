import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';

@Component({
  selector: 'app-legal-footer-links',
  standalone: true,
  imports: [RouterLink, AnalyticsCtaDirective],
  template: `
    <nav class="legal-footer-nav" aria-label="Documentos legais">
      <a routerLink="/privacidade" appAnalyticsCta="privacidade" appAnalyticsCtaLocation="legal_footer">Privacidade</a>
      <a routerLink="/cookies" appAnalyticsCta="cookies" appAnalyticsCtaLocation="legal_footer">Cookies</a>
      <a routerLink="/termos" appAnalyticsCta="termos" appAnalyticsCtaLocation="legal_footer">Termos de Uso</a>
    </nav>
  `,
  styles: [`
    .legal-footer-nav {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem 1.25rem;
    }

    a {
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-decoration: none;
    }

    a:hover {
      color: var(--primary);
    }
  `]
})
export class LegalFooterLinksComponent {}
