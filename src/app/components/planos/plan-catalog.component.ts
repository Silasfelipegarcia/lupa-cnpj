import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { PaymentService } from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PlanCatalogItem, SubscriptionPlan } from '../../models/auth.model';
import { SavedCard } from '../../models/payment.model';

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
  cvv = '';

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
        next: (config) => this.pagamentosConfigurados.set(config.configured && !!config.publicKey),
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
    }
  }

  planoAtual(): SubscriptionPlan | undefined {
    return this.authService.currentUser()?.plan;
  }

  isPlanoAtual(plan?: SubscriptionPlan): boolean {
    if (!plan || this.authService.isMaster()) {
      return false;
    }
    return this.planoAtual() === plan;
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
      this.mensagem.set('Processando pagamento...');
      this.paymentService.cobrarPlano({
        plan: plan as 'PREMIUM' | 'PRO_PLUS',
        cardId,
        securityCode: this.cvv.trim()
      }).subscribe({
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
      return;
    }

    this.mensagem.set('Redirecionando para o pagamento...');
    this.planService.iniciarCheckout(plan).subscribe({
      next: (checkout) => {
        const url = checkout.initPoint || checkout.sandboxInitPoint;
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
}
