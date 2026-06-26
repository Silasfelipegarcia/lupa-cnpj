import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (onNavigate) {
      <button type="button" class="brand" (click)="onNavigate()" [attr.aria-label]="ariaLabel">
        <img class="brand-icon" src="favicon.svg" width="36" height="36" alt="Lupa Insights" />
        <span class="brand-name">Lupa Insights</span>
      </button>
    } @else {
      <a class="brand" [routerLink]="link" [attr.aria-label]="ariaLabel">
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
  @Input() link = '/';
  @Input() ariaLabel = 'Lupa Insights — início';
  @Input() onNavigate?: () => void;
}
