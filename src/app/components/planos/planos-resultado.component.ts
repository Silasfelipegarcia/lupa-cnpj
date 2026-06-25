import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { Subscription, timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

@Component({
  selector: 'app-planos-resultado',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent],
  template: `
    <div class="app-page">
      <div class="app-container app-container--sm">
        <app-header />
        <main class="card resultado-card">
          @if (tipo === 'sucesso') {
            <h1>Pagamento recebido</h1>
            <p>{{ mensagemStatus }}</p>
          } @else {
            <h1>Pagamento pendente</h1>
            <p>{{ mensagemStatus }}</p>
          }
          <div class="actions">
            <a routerLink="/app" class="btn btn-primary">Ir para o painel</a>
            <a routerLink="/conta/plano" class="btn btn-outline">Ver planos</a>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .resultado-card {
      text-align: center;
      margin-top: 2rem;
    }
    h1 {
      margin: 0 0 1rem;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 1.5rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  `]
})
export class PlanosResultadoComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  private refreshSub?: Subscription;

  tipo: 'sucesso' | 'pendente' = 'pendente';
  mensagemStatus = 'Seu plano será atualizado em instantes. Você já pode voltar ao painel.';

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    this.tipo = path.includes('sucesso') ? 'sucesso' : 'pendente';

    if (this.tipo === 'pendente') {
      this.mensagemStatus = 'Estamos aguardando a confirmação do Mercado Pago. Atualizando seu plano...';
    }

    if (this.authService.isAuthenticated()) {
      this.atualizarPlanoComRetry();
    }
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  private atualizarPlanoComRetry(): void {
    const planoInicial = this.authService.currentUser()?.plan;

    this.refreshSub = timer(0, 3000).pipe(
      take(4),
      switchMap(() => this.authService.refreshMe())
    ).subscribe({
      next: () => {
        const planoAtual = this.authService.currentUser()?.plan;
        if (planoAtual && planoAtual !== 'FREE' && planoAtual !== planoInicial) {
          this.tipo = 'sucesso';
          this.mensagemStatus = 'Plano ativado com sucesso! Você já pode usar os novos limites.';
        }
      },
      error: () => {}
    });
  }
}
