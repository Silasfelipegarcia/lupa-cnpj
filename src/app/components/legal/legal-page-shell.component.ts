import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-legal-page-shell',
  standalone: true,
  imports: [RouterLink, AppBrandComponent, LegalFooterLinksComponent],
  template: `
    <div class="legal-page">
      <header class="legal-topbar">
        <app-brand link="/" ariaLabel="Lupa Insights — início" />
        <a routerLink="/" class="legal-back">← Voltar ao site</a>
      </header>

      <main class="legal-main">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="legal-subtitle">{{ subtitle }}</p>
        }
        <div class="legal-body">
          <ng-content />
        </div>
        <p class="legal-updated">Última atualização: {{ updated }}</p>
      </main>

      <footer class="legal-footer">
        <app-legal-footer-links />
        <p>{{ year }} {{ productName }}</p>
      </footer>
    </div>
  `,
  styleUrl: './legal-page-shell.component.scss'
})
export class LegalPageShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() updated = '';
  @Input() productName = 'Lupa Insights';
  year = new Date().getFullYear();
}
