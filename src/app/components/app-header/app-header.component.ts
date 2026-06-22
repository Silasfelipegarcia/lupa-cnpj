import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AppBrandComponent],
  template: `
    <header class="app-header">
      <app-brand />
      <nav class="nav">
        @if (authService.isAuthenticated()) {
          <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Importar
          </a>
          <a routerLink="/historico" routerLinkActive="active">Histórico</a>
          <a routerLink="/planos" routerLinkActive="active">Planos</a>
          @if (authService.currentUser(); as user) {
            <span class="plan-badge" [class.plan-badge--master]="authService.isMaster()">
              {{ user.planNome || 'Free' }}
            </span>
            <span class="user-name">{{ user.nome }}</span>
          }
          @if (!authService.isMaster() && authService.currentUser()?.plan !== 'PRO_PLUS') {
            <a routerLink="/planos" class="btn-upgrade">Upgrade</a>
          }
          <button type="button" class="btn-logout" (click)="sair()">Sair</button>
        } @else {
          <a routerLink="/planos" routerLinkActive="active">Planos</a>
          <a routerLink="/login" class="nav-link-muted">Entrar</a>
          <a routerLink="/cadastro" class="btn-upgrade">Cadastrar</a>
        }
      </nav>
    </header>
  `,
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .nav a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }

    .nav a:hover,
    .nav a.active {
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
    }

    .nav-link-muted {
      color: #94a3b8 !important;
    }

    .plan-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.15);
      color: #7dd3fc;
    }

    .plan-badge--master {
      background: rgba(167, 139, 250, 0.2);
      color: #c4b5fd;
    }

    .btn-upgrade {
      background: linear-gradient(135deg, #0ea5e9, #6366f1) !important;
      color: #fff !important;
      font-size: 0.8rem !important;
    }

    .user-name {
      color: #cbd5e1;
      font-size: 0.85rem;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-logout {
      background: transparent;
      border: 1px solid #475569;
      color: #94a3b8;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }

    .btn-logout:hover {
      border-color: #f87171;
      color: #fecaca;
    }
  `]
})
export class AppHeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
