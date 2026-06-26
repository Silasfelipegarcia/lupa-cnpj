import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-footer-links',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="legal-footer-nav" aria-label="Documentos legais">
      <a routerLink="/privacidade">Privacidade</a>
      <a routerLink="/cookies">Cookies</a>
      <a routerLink="/termos">Termos de Uso</a>
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
