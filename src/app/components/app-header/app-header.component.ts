import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AccountMenuComponent } from '../account-menu/account-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppBrandComponent, AccountMenuComponent],
  template: `
    <header class="app-header">
      <app-brand />
      <nav class="nav">
        @if (authService.isAuthenticated()) {
          <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Importar
          </a>
          <a routerLink="/historico" routerLinkActive="active">Histórico</a>
          <app-account-menu />
        } @else {
          <a routerLink="/planos" routerLinkActive="active">Planos</a>
          <a routerLink="/login">Entrar</a>
          <a routerLink="/cadastro" class="btn-upgrade">Cadastrar</a>
        }
      </nav>
    </header>
  `
})
export class AppHeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
