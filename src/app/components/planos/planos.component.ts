import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AppHeaderComponent } from '../app-header/app-header.component';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { PlanCatalogItem, SubscriptionPlan } from '../../models/auth.model';

@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, RouterLink, AppHeaderComponent],
  templateUrl: './planos.component.html',
  styleUrl: './planos.component.scss'
})
export class PlanosComponent implements OnInit {

  readonly authService = inject(AuthService);
  private readonly planService = inject(PlanService);
  private readonly router = inject(Router);

  catalogo = signal<PlanCatalogItem[]>([]);
  carregando = signal(true);
  processando = signal<SubscriptionPlan | null>(null);
  mensagem = signal('');
  erro = signal('');

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
      this.authService.refreshMe().subscribe({ error: () => {} });
    }
  }

  planoAtual(): SubscriptionPlan | undefined {
    return this.authService.currentUser()?.plan;
  }

  isPlanoAtual(plan: SubscriptionPlan): boolean {
    if (this.authService.isMaster()) {
      return false;
    }
    return this.planoAtual() === plan;
  }

  podeAssinar(item: PlanCatalogItem): boolean {
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

  assinar(plan: SubscriptionPlan): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { redirect: '/planos' } });
      return;
    }

    if (this.processando() || !this.podeAssinar(this.catalogo().find((i) => i.plan === plan)!)) {
      return;
    }

    this.processando.set(plan);
    this.erro.set('');
    this.mensagem.set('Redirecionando para o pagamento...');

    this.planService.iniciarCheckout(plan).subscribe({
      next: (checkout) => {
        const url = checkout.initPoint || checkout.sandboxInitPoint;
        if (!url) {
          this.erro.set('Checkout indisponível no momento.');
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
