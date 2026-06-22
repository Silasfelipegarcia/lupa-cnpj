import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PlanCatalogItem, SubscriptionPlan } from '../../models/auth.model';

@Component({
  selector: 'app-plan-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-catalog.component.html',
  styleUrl: './plan-catalog.component.scss'
})
export class PlanCatalogComponent implements OnInit {

  readonly authService = inject(AuthService);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);

  /** Quando true, exibe só planos pagos + business (página pública). */
  somentePublico = input(false);

  catalogo = signal<PlanCatalogItem[]>([]);
  carregando = signal(true);
  processando = signal<SubscriptionPlan | 'trial' | null>(null);
  mensagem = signal('');
  erro = signal('');

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

    this.processando.set(plan);
    this.erro.set('');
    this.mensagem.set('Redirecionando para o pagamento...');
    this.analytics.track('upgrade', { plan });

    this.planService.iniciarCheckout(plan).subscribe({
      next: (checkout) => {
        const url = checkout.initPoint || checkout.sandboxInitPoint;
        if (!url) {
          this.erro.set('Checkout indisponível no momento. Tente novamente em instantes.');
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
