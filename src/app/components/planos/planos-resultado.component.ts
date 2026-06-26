import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { SubscriptionPlan } from '../../models/auth.model';
import { CheckoutSyncRequest, CHECKOUT_ORDER_STORAGE_KEY } from '../../models/payment.model';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-planos-resultado',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent, AnalyticsCtaDirective],
  template: `
    <div class="app-page">
      <div class="app-container app-container--lg">
        <app-header />
        <main class="card resultado-card">
          @if (tipo === 'sucesso') {
            <h1>Pagamento recebido</h1>
            <p>{{ mensagemStatus }}</p>
          } @else {
            <h1>Pagamento pendente</h1>
            <p>{{ mensagemStatus }}</p>
          }
          @if (avisoLocal) {
            <p class="aviso-local">{{ avisoLocal }}</p>
          }
          <div class="actions">
            <a routerLink="/app" class="btn btn-primary" appAnalyticsCta="ir_painel" appAnalyticsCtaLocation="payment_result">Ir para o painel</a>
            <a routerLink="/conta/plano" class="btn btn-outline" appAnalyticsCta="ver_planos" appAnalyticsCtaLocation="payment_result">Ver planos</a>
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
    .aviso-local {
      font-size: 0.85rem;
      color: var(--text-muted);
      max-width: 32rem;
      margin-left: auto;
      margin-right: auto;
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
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly paymentService = inject(PaymentService);
  private readonly analytics = inject(AnalyticsService);

  private syncSub?: Subscription;

  tipo: 'sucesso' | 'pendente' = 'pendente';
  mensagemStatus = 'Sincronizando pagamento com o Mercado Pago...';
  avisoLocal = '';

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    this.tipo = path.includes('sucesso') ? 'sucesso' : 'pendente';

    if (!this.authService.isAuthenticated()) {
      const redirect = this.router.url;
      void this.router.navigate(['/login'], { queryParams: { redirect } });
      return;
    }

    this.sincronizarPagamento();
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  private sincronizarPagamento(): void {
    const params = this.route.snapshot.queryParamMap;
    const body: CheckoutSyncRequest = {
      paymentId: params.get('payment_id') ?? params.get('collection_id') ?? undefined,
      externalReference: params.get('external_reference') ?? undefined,
      preferenceId: params.get('preference_id') ?? undefined,
      orderId: sessionStorage.getItem(CHECKOUT_ORDER_STORAGE_KEY) ?? undefined
    };

    this.syncSub = this.paymentService.sincronizarCheckout(body).subscribe({
      next: (result) => {
        sessionStorage.removeItem(CHECKOUT_ORDER_STORAGE_KEY);
        this.authService.refreshMe(true).subscribe({ error: () => {} });
        this.aplicarResultado(result.status, result.planNome, result.orderId);
      },
      error: (msg: string) => {
        this.analytics.trackPurchaseSyncError(msg);
        this.mensagemStatus = msg;
        this.avisoLocal = environment.production
          ? 'Se você acabou de pagar, aguarde alguns segundos e recarregue esta página.'
          : 'Sandbox local: após pagar no MP, abra /planos/sucesso se não redirecionar sozinho.';
        this.authService.refreshMe(true).subscribe({ error: () => {} });
      }
    });
  }

  private aplicarResultado(status: string, planNome: string, orderId?: string): void {
    const aprovado = status?.toUpperCase() === 'APPROVED';
    this.tipo = aprovado ? 'sucesso' : 'pendente';
    const plan = this.authService.currentUser()?.plan ?? this.inferirPlano(planNome);

    if (aprovado && plan && plan !== 'FREE') {
      this.analytics.trackPurchase(planNome, plan, orderId);
      this.mensagemStatus = `Plano ${planNome} ativado com sucesso! Você já pode usar os novos limites.`;
      return;
    }
    if (status?.toUpperCase() === 'PENDING') {
      if (plan && plan !== 'FREE') {
        this.analytics.trackPurchasePending(plan, orderId);
      }
      this.mensagemStatus = 'Pagamento pendente no Mercado Pago. Atualizaremos assim que for confirmado.';
      return;
    }
    this.mensagemStatus = `Status do pagamento: ${status}. Confira em Conta → Plano.`;
  }

  private inferirPlano(planNome: string): SubscriptionPlan | undefined {
    const nome = planNome.toLowerCase();
    if (nome.includes('growth')) {
      return 'PRO_PLUS';
    }
    if (nome.includes('prospec')) {
      return 'PREMIUM';
    }
    return undefined;
  }
}
