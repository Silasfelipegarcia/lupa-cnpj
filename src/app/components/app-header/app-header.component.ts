import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AccountMenuComponent } from '../account-menu/account-menu.component';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppBrandComponent, AccountMenuComponent, AnalyticsCtaDirective],
  template: `
    <header class="app-header">
      <app-brand analyticsLocation="header" />
      <nav class="nav">
        @if (authService.isAuthenticated()) {
          <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
             appAnalyticsCta="importar" appAnalyticsCtaLocation="header">
            Importar
          </a>
          <a routerLink="/historico" routerLinkActive="active"
             appAnalyticsCta="historico" appAnalyticsCtaLocation="header">
            Histórico
          </a>
          <app-account-menu />
        } @else {
          <a routerLink="/planos" routerLinkActive="active"
             appAnalyticsCta="planos" appAnalyticsCtaLocation="header">
            Planos
          </a>
          <a routerLink="/login" appAnalyticsCta="entrar" appAnalyticsCtaLocation="header">Entrar</a>
          <a routerLink="/cadastro" class="btn-upgrade"
             appAnalyticsCta="desbloquear_gratis" appAnalyticsCtaLocation="header">
            Cadastrar
          </a>
        }
      </nav>
    </header>
  `
})
export class AppHeaderComponent {
  readonly authService = inject(AuthService);
}
