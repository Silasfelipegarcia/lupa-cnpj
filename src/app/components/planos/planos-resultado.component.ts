import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';

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
            <p>Seu plano será atualizado em instantes. Você já pode voltar ao painel.</p>
          } @else {
            <h1>Pagamento pendente</h1>
            <p>Estamos aguardando a confirmação do Mercado Pago. Atualize esta página em alguns segundos.</p>
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
export class PlanosResultadoComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  tipo: 'sucesso' | 'pendente' = 'pendente';

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    this.tipo = path.includes('sucesso') ? 'sucesso' : 'pendente';
    if (this.authService.isAuthenticated()) {
      this.authService.refreshMe().subscribe({ error: () => {} });
    }
  }
}
