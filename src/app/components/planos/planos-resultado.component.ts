import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-planos-resultado',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent],
  template: `
    <div class="page">
      <app-header />
      <main class="card">
        @if (tipo === 'sucesso') {
          <h1>Pagamento recebido</h1>
          <p>Seu plano será atualizado em instantes. Você já pode voltar ao painel.</p>
        } @else {
          <h1>Pagamento pendente</h1>
          <p>Estamos aguardando a confirmação do Mercado Pago. Atualize esta página em alguns segundos.</p>
        }
        <div class="actions">
          <a routerLink="/app" class="btn btn-primary">Ir para o painel</a>
          <a routerLink="/planos" class="btn btn-outline">Ver planos</a>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 2.5rem 1.5rem;
      max-width: 560px;
      margin: 0 auto;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }
    h1 { margin: 0 0 1rem; font-size: 1.5rem; }
    p { color: #94a3b8; line-height: 1.6; margin: 0 0 1.5rem; }
    .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
    .btn {
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .btn-primary { background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; }
    .btn-outline { border: 1px solid #475569; color: #94a3b8; }
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
