import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { PaymentService } from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PlanCatalogItem, SubscriptionPlan, CheckoutResponse } from '../../models/auth.model';
import { PlanQuote, SavedCard } from '../../models/payment.model';

declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => {
      createCardToken: (data: Record<string, string>) => Promise<{ id?: string }>;
      fields?: {
        createCardToken: (data: Record<string, string>) => Promise<{ id?: string }>;
      };
    };
  }
}

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './plan-catalog.component.scss'
})
export class PlanCatalogComponent implements OnInit {

  readonly authService = inject(AuthService);
  private readonly planService = inject(PlanService);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  /** Quando true, exibe só planos pagos + business (página pública). */
  somentePublico = input(false);

  catalogo = signal<PlanCatalogItem[]>([]);
  carregando = signal(true);
  processando = signal<SubscriptionPlan | 'trial' | null>(null);
  mensagem = signal('');
  erro = signal('');

  cartoes = signal<SavedCard[]>([]);
  cartaoSelecionado = signal('');
  pagamentosConfigurados = signal(true);
  mpPublicKey = signal('');
  cotacoes = signal<Partial<Record<SubscriptionPlan, PlanQuote>>>({});
  cvv = '';

  private mp: {
    createCardToken: (data: Record<string, string>) => Promise<{ id?: string }>;
    fields?: { createCardToken: (data: Record<string, string>) => Promise<{ id?: string }> };
  } | null = null;

  planosPrincipais = computed(() => this.catalogo().filter((i) => !i.contatoComercial));
  planoBusiness = computed(() => this.catalogo().find((i) => i.contatoComercial));

  ngOnInit(): void {
    this.planService.listarCatalogo().subscribe({
      next: (items) => {
        this.catalogo.set(items);
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      }
    });

    if (this.authService.isAuthenticated()) {
      this.paymentService.obterConfig().subscribe({
        next: async (config) => {
          this.mpPublicKey.set(config.publicKey ?? '');
          this.pagamentosConfigurados.set(config.configured && !!config.publicKey);
          if (config.configured && config.publicKey) {
            try {
              await loadMercadoPago();
              this.mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });
            } catch {
              this.mp = null;
            }
          }
        },
        error: () => this.pagamentosConfigurados.set(false)
      });

      this.paymentService.listarCartoes().subscribe({
        next: (cards) => {
          this.cartoes.set(cards);
          if (cards.length > 0) {
            this.cartaoSelecionado.set(cards[0].id);
          }
        },
        error: () => {}
      });

      this.carregarCotacoes();
    }
  }

  private carregarCotacoes(): void {
    const planos: Array<'PREMIUM' | 'PRO_PLUS'> = ['PREMIUM', 'PRO_PLUS'];
    for (const plan of planos) {
      this.paymentService.obterCotacao(plan).subscribe({
        next: (quote) => {
          this.cotacoes.update((atual) => ({ ...atual, [plan]: quote }));
        },
        error: () => {}
      });
    }
  }

  cotacao(plan?: SubscriptionPlan): PlanQuote | undefined {
    if (!plan) {
      return undefined;
    }
    return this.cotacoes()[plan];
  }

  rotuloAssinatura(plan: SubscriptionPlan): string {
    const quote = this.cotacao(plan);
    if (quote?.upgrade) {
      return `Upgrade por ${quote.amountLabel}`;
    }
    return 'Assinar (checkout)';
  }

  private urlCheckoutMercadoPago(checkout: CheckoutResponse): string | null {
    const sandbox = checkout.sandboxInitPoint;
    const producao = checkout.initPoint;
    const isTeste = this.mpPublicKey().startsWith('TEST-');
    return isTeste ? (sandbox || producao || null) : (producao || sandbox || null);
  }

  planoAtual(): SubscriptionPlan | undefined {
    return this.authService.currentUser()?.plan;
  }

  isPlanoAtual(plan?: SubscriptionPlan): boolean {
    if (!plan || this.authService.isMaster()) {
      return false;
    }
    const user = this.authService.currentUser();
    if (!user || user.plan !== plan) {
      return false;
    }
    if (plan === 'FREE') {
      return true;
    }
    const sub = user.subscription;
    if (!sub) {
      return plan === user.plan;
    }
    return sub.status === 'ACTIVE' || sub.status === 'CANCELLED_PENDING';
  }

  podeAssinar(item: PlanCatalogItem): boolean {
    if (item.contatoComercial || !item.plan) {
      return false;
    }
    if (this.authService.isMaster()) {
      return false;
    }
    if (item.plan === 'FREE') {
      return false;
    }
    const atual = this.planoAtual();
    if (item.plan === 'PREMIUM' && atual === 'PRO_PLUS') {
      return false;
    }
    return !this.isPlanoAtual(item.plan);
  }

  trialDisponivel(): boolean {
    return !!this.authService.currentUser()?.usage?.trialDisponivel;
  }

  iniciarTrial(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/conta/plano' } });
      return;
    }
    if (this.processando()) {
      return;
    }

    this.processando.set('trial');
    this.planService.iniciarTrial().subscribe({
      next: () => {
        this.authService.refreshMe().subscribe({ error: () => {} });
        this.analytics.track('trial_start');
        this.mensagem.set('Trial de 7 dias no plano Prospecção ativado!');
        this.processando.set(null);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(null);
      }
    });
  }

  assinar(plan: SubscriptionPlan): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/planos' } });
      return;
    }

    const item = this.catalogo().find((i) => i.plan === plan);
    if (this.processando() || !item || !this.podeAssinar(item)) {
      return;
    }

    if (!this.pagamentosConfigurados()) {
      this.erro.set('Pagamentos não configurados no servidor. Verifique as variáveis Mercado Pago na API.');
      return;
    }

    this.processando.set(plan);
    this.erro.set('');
    this.analytics.track('upgrade', { plan });

    const cardId = this.cartaoSelecionado();
    if (cardId && this.cvv.trim().length >= 3) {
      void this.pagarComCartaoSalvo(plan, cardId);
      return;
    }

    this.mensagem.set('Redirecionando para o pagamento...');
    const idempotencyKey = crypto.randomUUID();
    this.planService.iniciarCheckout(plan, idempotencyKey).subscribe({
      next: (checkout) => {
        const url = this.urlCheckoutMercadoPago(checkout);
        if (!url) {
          this.erro.set('Checkout indisponível. Cadastre um cartão em Cobrança ou tente mais tarde.');
          this.processando.set(null);
          this.mensagem.set('');
          return;
        }
        window.location.href = url;
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.processando.set(null);
        this.mensagem.set('');
      }
    });
  }

  private async pagarComCartaoSalvo(plan: SubscriptionPlan, cardId: string): Promise<void> {
    this.mensagem.set('Validando cartão...');
    try {
      const token = await this.gerarTokenCartaoSalvo(cardId, this.cvv.trim());
      this.mensagem.set('Processando pagamento...');
      const idempotencyKey = crypto.randomUUID();
      this.paymentService.cobrarPlano({
        plan: plan as 'PREMIUM' | 'PRO_PLUS',
        token,
        cardId
      }, idempotencyKey).subscribe({
        next: (result) => {
          this.cvv = '';
          this.authService.refreshMe().subscribe({ error: () => {} });
          if (result.status === 'APPROVED') {
            this.mensagem.set(`Plano ${result.planNome} ativado com sucesso!`);
          } else {
            this.mensagem.set(`Pagamento ${result.statusLabel.toLowerCase()}. Aguarde a confirmação.`);
          }
          this.processando.set(null);
        },
        error: (msg: string) => {
          this.erro.set(msg);
          this.processando.set(null);
          this.mensagem.set('');
        }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível validar o cartão. Verifique o CVV.';
      this.erro.set(msg);
      this.processando.set(null);
      this.mensagem.set('');
    }
  }

  private async gerarTokenCartaoSalvo(cardId: string, securityCode: string): Promise<string> {
    if (!this.mp) {
      await loadMercadoPago();
      const key = this.mpPublicKey();
      if (!key) {
        throw new Error('Mercado Pago não configurado.');
      }
      this.mp = new window.MercadoPago(key, { locale: 'pt-BR' });
    }

    const payload = { cardId, securityCode };
    let tokenResult: { id?: string } | undefined;
    if (this.mp.fields?.createCardToken) {
      tokenResult = await this.mp.fields.createCardToken(payload);
    } else {
      tokenResult = await this.mp.createCardToken(payload);
    }

    if (!tokenResult?.id) {
      throw new Error('Não foi possível validar o cartão. Verifique o CVV.');
    }
    return tokenResult.id;
  }
}
