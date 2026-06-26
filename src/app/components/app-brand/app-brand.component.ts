import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (onNavigate) {
      <button type="button" class="brand" (click)="navegar()" [attr.aria-label]="ariaLabel">
        <img class="brand-icon" src="favicon.svg" width="36" height="36" alt="Lupa Insights" />
        <span class="brand-name">Lupa Insights</span>
      </button>
    } @else {
      <a class="brand" [routerLink]="link" (click)="rastrearLink()" [attr.aria-label]="ariaLabel">
        <img class="brand-icon" src="favicon.svg" width="36" height="36" alt="Lupa Insights" />
        <span class="brand-name">Lupa Insights</span>
      </a>
    }
  `,
  styles: [`
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
      color: inherit;
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
    }
  `]
})
export class AppBrandComponent {
  private readonly analytics = inject(AnalyticsService);

  @Input() link = '/';
  @Input() ariaLabel = 'Lupa Insights — início';
  @Input() analyticsLocation = 'brand';
  @Input() analyticsCtaName = 'brand_home';
  @Input() onNavigate?: () => void;

  rastrearLink(): void {
    this.analytics.trackCtaClick(this.analyticsCtaName, this.analyticsLocation);
  }

  navegar(): void {
    this.analytics.trackCtaClick(this.analyticsCtaName, this.analyticsLocation);
    this.onNavigate?.();
  }
}
