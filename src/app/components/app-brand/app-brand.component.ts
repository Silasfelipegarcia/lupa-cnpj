import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (onNavigate) {
      <button type="button" class="brand" (click)="onNavigate()" [attr.aria-label]="ariaLabel">
        <img class="brand-icon" src="favicon.svg" width="40" height="40" alt="" />
        <span class="brand-name">LupaCNPJ</span>
      </button>
    } @else {
      <a class="brand" [routerLink]="link" [attr.aria-label]="ariaLabel">
        <img class="brand-icon" src="favicon.svg" width="40" height="40" alt="" />
        <span class="brand-name">LupaCNPJ</span>
      </a>
    }
  `,
  styles: [`
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
      background: none;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
    }

    .brand-icon {
      display: block;
      border-radius: 10px;
      flex-shrink: 0;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }
  `]
})
export class AppBrandComponent {
  @Input() link = '/';
  @Input() ariaLabel = 'LupaCNPJ — início';
  @Input() onNavigate?: () => void;
}
