import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="account-menu" #root>
      <button
        type="button"
        class="account-trigger"
        (click)="toggle()"
        [attr.aria-expanded]="aberto()"
        aria-haspopup="menu"
      >
        <span class="account-avatar">{{ iniciais() }}</span>
        <span class="account-trigger-name">{{ authService.currentUser()?.nome }}</span>
        <span class="account-chevron" [class.account-chevron--open]="aberto()">▾</span>
      </button>

      @if (aberto()) {
        <div class="account-dropdown" role="menu">
          <div class="account-dropdown-header">
            <strong>{{ authService.currentUser()?.nome }}</strong>
            <span>{{ authService.currentUser()?.email }}</span>
            <span class="plan-badge" [class.plan-badge--master]="authService.isMaster()">
              {{ authService.currentUser()?.planNome || 'Free' }}
            </span>
          </div>
          <nav class="account-dropdown-nav">
            <a routerLink="/conta/perfil" role="menuitem" (click)="fechar()">Dados da conta</a>
            <a routerLink="/conta/plano" role="menuitem" (click)="fechar()">Plano e uso</a>
            <a routerLink="/conta/cobranca" role="menuitem" (click)="fechar()">Cobrança</a>
          </nav>
          @if (mostrarUpgrade()) {
            <a routerLink="/conta/plano" class="account-dropdown-upgrade" (click)="fechar()">Fazer upgrade</a>
          }
          <button type="button" class="account-dropdown-logout" (click)="sair()">Sair</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .account-menu {
      position: relative;
    }

    .account-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.5rem 0.35rem 0.35rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      background: var(--surface-card);
      cursor: pointer;
      font-family: var(--font);
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: var(--primary-border);
        box-shadow: var(--shadow-sm);
      }
    }

    .account-avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .account-trigger-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .account-chevron {
      font-size: 0.7rem;
      color: var(--text-muted);
      transition: transform 0.15s;

      &--open {
        transform: rotate(180deg);
      }
    }

    .account-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 260px;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 0.5rem;
      z-index: 100;
    }

    .account-dropdown-header {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.75rem 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0.35rem;

      strong {
        font-size: 0.95rem;
        color: var(--text-primary);
      }

      span:not(.plan-badge) {
        font-size: 0.82rem;
        color: var(--text-secondary);
        word-break: break-all;
      }

      .plan-badge {
        margin-top: 0.35rem;
        align-self: flex-start;
      }
    }

    .account-dropdown-nav {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      a {
        display: block;
        padding: 0.6rem 0.85rem;
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: 0.88rem;
        font-weight: 500;
        text-decoration: none;

        &:hover {
          background: var(--surface-muted);
          text-decoration: none;
        }
      }
    }

    a.account-dropdown-upgrade {
      display: block;
      margin: 0.5rem 0.35rem 0.25rem;
      padding: 0.55rem 0.85rem;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: var(--text-inverse);
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;

      &:hover,
      &:focus-visible {
        background: var(--primary-hover);
        color: var(--text-inverse);
        text-decoration: none;
      }
    }

    .account-dropdown-logout {
      display: block;
      width: calc(100% - 0.7rem);
      margin: 0.35rem;
      padding: 0.55rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--text-secondary);
      font-family: var(--font);
      font-size: 0.85rem;
      cursor: pointer;

      &:hover {
        border-color: var(--error-border);
        color: var(--error);
      }
    }

    @media (max-width: 520px) {
      .account-trigger-name {
        display: none;
      }
    }
  `]
})
export class AccountMenuComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  aberto = signal(false);

  iniciais(): string {
    const nome = this.authService.currentUser()?.nome?.trim() ?? '';
    if (!nome) {
      return '?';
    }
    const partes = nome.split(/\s+/).filter(Boolean);
    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  mostrarUpgrade(): boolean {
    const user = this.authService.currentUser();
    return !this.authService.isMaster() && user?.plan !== 'PRO_PLUS';
  }

  toggle(): void {
    this.aberto.update((v) => !v);
  }

  fechar(): void {
    this.aberto.set(false);
  }

  sair(): void {
    this.fechar();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fechar();
  }
}
