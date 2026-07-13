import { Component, ElementRef, OnInit, ViewChild, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { PaymentService } from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { PlanCatalogItem, SubscriptionPlan, CheckoutResponse } from '../../models/auth.model';
import { PlanQuote, SavedCard, CHECKOUT_ORDER_STORAGE_KEY } from '../../models/payment.model';

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AnalyticsCtaDirective],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './plan-catalog.component.scss'
})
export class PlanCatalogComponent implements OnInit {

  @ViewChild('paymentPrefs') paymentPrefs?: ElementRef<HTMLElement>;
  @ViewChild('cvvInput') cvvInput?: ElementRef<HTMLInputElement>;

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
  cvv = signal('');
  pagamentosConfigurados = signal(true);
  mpPublicKey = signal('');
  cotacoes = signal<Partial<Record<SubscriptionPlan, PlanQuote>>>({});
  parcelas = signal(1);

  planosPrincipais = computed(() => this.catalogo().filter((i) => !i.contatoComercial));
  sandboxMercadoPago = computed(() => this.mpPublicKey().startsWith('TEST-'));
  cvvInformado = computed(() => this.cvv().trim().length >= 3);

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
        next: (config) => {
          this.mpPublicKey.set(config.publicKey ?? '');
          this.pagamentosConfigurados.set(config.configured && !!config.publicKey);
        },
        error: () => this.pagamentosConfigurados.set(false)
      });

      this.paymentService.listarCartoes().subscribe({
        next: (cards) => {
          this.cartoes.set(cards);
          if (cards.length > 0) {
            const padrao = cards.find((c) => c.defaultCard) ?? cards[0];
            this.cartaoSelecionado.set(padrao.id);
          }
        },
        error: () => {}
      });

      this.carregarCotacoes();
    }
  }

  onParcelasChange(value: number): void {
    this.parcelas.set(value);
    if (this.authService.isAuthenticated()) {
      this.carregarCotacoes();
    }
  }

  rotuloParcelaAvista(item: PlanCatalogItem): string {
    const label = item.annualPriceLabel || item.priceLabel;
    return `À vista (${label})`;
  }

  rotuloParcela12x(item: PlanCatalogItem): string {
    return `12x de ${item.priceLabel}`;
  }

  rotuloPrecoPlano(item: PlanCatalogItem, quote?: PlanQuote): string {
    if (quote?.upgrade) {
      return quote.amountLabel;
    }
    if (this.parcelas() === 12 && item.priceCents > 0) {
      return `12x de ${item.priceLabel}`;
    }
    return item.priceLabel;
  }

  notaPrecoPlano(item: PlanCatalogItem, quote?: PlanQuote): string | null {
    if (item.plan === 'ADMIN_TEST') {
      return item.paymentOptionsLabel ?? 'Pagamento único';
    }
    if (quote?.upgrade) {
      return quote.description ?? null;
    }
    if (item.priceCents <= 0) {
      return null;
    }
    const opcoesPagamento = item.plan === 'PREMIUM' && this.authService.isAuthenticated()
      ? 'À vista ou em até 12x no cartão'
      : (item.paymentOptionsLabel ?? 'Cobrança anual');
    if (this.parcelas() === 12) {
      return `Total anual ${item.annualPriceLabel} · ${opcoesPagamento}`;
    }
    return `${item.annualPriceLabel} · ${opcoesPagamento}`;
  }

  private carregarCotacoes(): void {
    const parcelas = this.parcelas();
    const planos: SubscriptionPlan[] = ['PREMIUM', 'PRO_PLUS'];
    if (this.authService.currentUser()?.role === 'ADMIN') {
      planos.push('ADMIN_TEST');
    }
    for (const plan of planos) {
      const parcelasPlano = plan === 'ADMIN_TEST' ? 1 : parcelas;
      this.paymentService.obterCotacao(plan, parcelasPlano).subscribe({
        next: (quote) => {
          this.cotacoes.update((atual) => ({ ...atual, [plan]: quote }));
        },
        error: () => {}
      });
    }
  }

  private urlCheckoutMercadoPago(checkout: CheckoutResponse): string | null {
    const sandbox = checkout.sandboxInitPoint;
    const producao = checkout.initPoint;
    const isTeste = this.mpPublicKey().startsWith('TEST-');
    return isTeste ? (sandbox || producao || null) : (producao || sandbox || null);
  }

  cotacao(plan?: SubscriptionPlan): PlanQuote | undefined {
    if (!plan) {
      return undefined;
    }
    return this.cotacoes()[plan];
  }

  rotuloAssinatura(plan: SubscriptionPlan): string {
    if (plan === 'ADMIN_TEST') {
      return 'Pagar R$ 1,00 no Mercado Pago';
    }
    if (this.cartoes().length > 0) {
      const quote = this.cotacao(plan);
      if (quote?.upgrade) {
        return 'Upgrade com cartão salvo';
      }
      return 'Pagar com cartão salvo';
    }
    const quote = this.cotacao(plan);
    if (quote?.upgrade) {
      return `Upgrade por ${quote.amountLabel}`;
    }
    if (this.parcelas() === 12) {
      const item = this.catalogo().find((i) => i.plan === plan);
      if (item?.priceLabel) {
        return `Assinar em 12x de ${item.priceLabel}`;
      }
    }
    return 'Assinar';
  }

  onCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    this.cvv.set(digits);
    input.value = digits;
    if (this.erro().toLowerCase().includes('cvv')) {
      this.erro.set('');
    }
  }

  private focarFormaPagamento(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const alvo = this.paymentPrefs?.nativeElement;
    if (!alvo) {
      return;
    }
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => this.cvvInput?.nativeElement.focus(), 250);
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
      return !this.emTrial();
    }
    if (this.emTrial() && plan === 'PREMIUM') {
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
    if (item.plan === 'ADMIN_TEST') {
      return this.authService.currentUser()?.role === 'ADMIN';
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

  emTrial(): boolean {
    return !!this.authService.currentUser()?.usage?.emTrial;
  }

  conversaoTrialPendente(): boolean {
    return !!this.authService.currentUser()?.usage?.conversaoTrialPendente;
  }

  trialDiasRestantes(): number {
    return this.authService.currentUser()?.usage?.trialDiasRestantes ?? 0;
  }

  exibirTrialPrimeiro(item: PlanCatalogItem): boolean {
    return item.plan === 'PREMIUM' && !this.authService.isAuthenticated();
  }

  irParaCadastro(origem: string): void {
    this.analytics.trackCtaClick('desbloquear_gratis', origem);
    void this.router.navigate(['/cadastro'], { queryParams: { redirect: '/planos' } });
  }

  irCadastrarCartao(): void {
    this.analytics.trackCtaClick('trial_add_card', 'plan_catalog');
    this.router.navigate(['/conta/cobranca'], {
      queryParams: { redirect: '/conta/plano', trial: '1' }
    });
  }

  assinar(plan: SubscriptionPlan, opcoes?: { adminTestCartaoSalvo?: boolean }): void {
    if (!this.authService.isAuthenticated()) {
      this.analytics.trackCtaClick('desbloquear_gratis', 'plan_catalog');
      this.router.navigate(['/cadastro'], { queryParams: { redirect: '/planos' } });
      return;
    }

    const item = this.catalogo().find((i) => i.plan === plan);
    if (this.processando()) {
      return;
    }
    if (!item || !this.podeAssinar(item)) {
      this.erro.set('Este plano não está disponível para assinatura no momento.');
      return;
    }

    if (!this.pagamentosConfigurados()) {
      this.erro.set('Pagamentos não configurados no servidor. Verifique as variáveis Mercado Pago na API.');
      return;
    }

    this.processando.set(plan);
    this.erro.set('');
    this.mensagem.set('');
    this.analytics.trackBeginCheckout(plan);

    if (plan === 'ADMIN_TEST' && !opcoes?.adminTestCartaoSalvo) {
      this.mensagem.set('Redirecionando para o Mercado Pago...');
      this.iniciarCheckout(plan);
      return;
    }

    if (this.cartoes().length > 0) {
      const cardId = this.cartaoSelecionado();
      if (!cardId) {
        this.erro.set('Selecione um cartão salvo.');
        this.processando.set(null);
        this.focarFormaPagamento();
        return;
      }
      if (!this.cvvInformado()) {
        this.erro.set('Informe o CVV do cartão (3 ou 4 dígitos) na seção Forma de pagamento.');
        this.processando.set(null);
        this.focarFormaPagamento();
        return;
      }
      this.pagarComCartaoSalvo(plan, cardId);
      return;
    }

    this.mensagem.set('Redirecionando para o pagamento...');
    this.iniciarCheckout(plan);
  }

  private pagarComCartaoSalvo(plan: SubscriptionPlan, cardId: string): void {
    const cvv = this.cvv().trim();
    if (cvv.length < 3) {
      this.erro.set('Informe o CVV do cartão (3 ou 4 dígitos).');
      this.processando.set(null);
      this.focarFormaPagamento();
      return;
    }

    this.mensagem.set('Processando pagamento...');
    const idempotencyKey = crypto.randomUUID();
    this.paymentService.cobrarPlano({
      plan,
      cardId,
      securityCode: cvv,
      installments: plan === 'ADMIN_TEST' ? 1 : this.parcelas()
    }, idempotencyKey).subscribe({
      next: (result) => {
        this.authService.refreshMe(true).subscribe({ error: () => {} });
        this.cvv.set('');
        if (result.status === 'APPROVED') {
          const quote = this.cotacao(plan);
          this.analytics.trackPurchase(
            result.planNome,
            plan,
            result.orderId,
            quote?.amountCents ?? quote?.fullPriceCents
          );
          if (plan === 'ADMIN_TEST') {
            this.mensagem.set('Pagamento teste de R$ 1,00 aprovado! Cartão e fluxo validados.');
          } else {
            this.mensagem.set(`Plano ${result.planNome} ativado! Assinatura anual vigente por 12 meses.`);
          }
        } else if (result.status === 'REJECTED' || result.status === 'CANCELLED') {
          if (plan === 'ADMIN_TEST' && this.deveUsarCheckoutAdminTest(result.message)) {
            this.mensagem.set(
              'Cartão válido, mas o antifraude bloqueou cobrança direta. Abrindo checkout Mercado Pago...'
            );
            this.erro.set('');
            this.iniciarCheckout(plan);
            return;
          }
          this.analytics.trackPurchaseError(result.message || result.statusLabel, plan);
          const detalhe = result.message || 'Pagamento recusado pelo emissor ou antifraude.';
          if (plan === 'ADMIN_TEST') {
            this.erro.set(
              `${detalhe} Use o botão "Pagar R$ 1,00 no Mercado Pago" para concluir o teste.`
            );
          } else {
            this.erro.set(detalhe);
          }
          this.mensagem.set('');
        } else {
          this.analytics.trackPurchasePending(plan, result.orderId);
          const detalhe = result.message
            ? `${result.statusLabel}: ${result.message}`
            : `Pagamento ${result.statusLabel.toLowerCase()}. Aguarde a confirmação.`;
          this.mensagem.set(detalhe);
        }
        this.processando.set(null);
      },
      error: (msg: string) => {
        if (this.sandboxMercadoPago() && this.deveUsarCheckoutComoFallback(msg)) {
          this.mensagem.set('Sandbox: cartão salvo indisponível aqui. Abrindo pagamento...');
          this.erro.set('');
          this.iniciarCheckout(plan);
          return;
        }
        this.analytics.trackPurchaseError(sanitizeAnalyticsError(msg), plan);
        this.erro.set(msg);
        this.processando.set(null);
        this.mensagem.set('');
      }
    });
  }

  private deveUsarCheckoutComoFallback(msg: string): boolean {
    const texto = msg.toLowerCase();
    return texto.includes('card not found')
        || texto.includes('cartão salvo')
        || texto.includes('validar o cartão')
        || texto.includes('processar o pagamento');
  }

  private deveUsarCheckoutAdminTest(msg?: string): boolean {
    const texto = (msg ?? '').toLowerCase();
    return texto.includes('antifraude')
        || texto.includes('high_risk')
        || texto.includes('checkout mercado pago')
        || texto.includes('recusado');
  }

  private iniciarCheckout(plan: SubscriptionPlan): void {
    const idempotencyKey = crypto.randomUUID();
    const parcelas = plan === 'ADMIN_TEST' ? 1 : this.parcelas();
    this.planService.iniciarCheckout(plan, idempotencyKey, parcelas).subscribe({
      next: (checkout) => {
        sessionStorage.setItem(CHECKOUT_ORDER_STORAGE_KEY, checkout.orderId);
        this.analytics.trackCheckoutRedirect(plan, checkout.orderId);
        const url = this.urlCheckoutMercadoPago(checkout);
        if (!url) {
          this.erro.set('Pagamento indisponível. Tente mais tarde.');
          this.processando.set(null);
          this.mensagem.set('');
          return;
        }
        if (this.sandboxMercadoPago()) {
          this.mensagem.set(
            'Sandbox: após pagar, se não voltar sozinho, abra http://localhost:4200/planos/sucesso'
          );
        } else if (plan === 'ADMIN_TEST') {
          this.mensagem.set(
            'Abrindo Mercado Pago… Use aba anônima ou outro e-mail se o botão Pagar ficar desabilitado.'
          );
        }
        window.location.href = url;
      },
      error: (msg: string) => {
        this.analytics.trackPurchaseError(sanitizeAnalyticsError(msg), plan);
        this.erro.set(msg);
        this.processando.set(null);
        this.mensagem.set('');
      }
    });
  }
}
