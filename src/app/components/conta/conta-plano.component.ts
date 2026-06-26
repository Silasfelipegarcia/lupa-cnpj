import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { PlanCatalogComponent } from '../planos/plan-catalog.component';
import { SubscriptionInfo } from '../../models/auth.model';

@Component({
  selector: 'app-conta-plano',
  standalone: true,
  imports: [CommonModule, PlanCatalogComponent],
  templateUrl: './conta-plano.component.html',
  styleUrl: './conta-plano.component.scss'
})
export class ContaPlanoComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly paymentService = inject(PaymentService);

  processandoAssinatura = signal(false);
  erroAssinatura = signal('');
  mensagemAssinatura = signal('');
  confirmarCancelamento = signal(false);

  ngOnInit(): void {
    this.authService.refreshMe().subscribe({ error: () => {} });
  }

  assinatura(): SubscriptionInfo | undefined {
    return this.authService.currentUser()?.subscription;
  }

  usoPlanilha(): string {
    const u = this.authService.currentUser()?.usage;
    if (!u || u.master) {
      return 'Ilimitado';
    }
    const limite = u.maxBatchSearchesPerDay ?? 0;
    return `${u.batchSearchesToday} de ${limite} empresas em planilha hoje`;
  }

  usoCnpj(): string {
    const u = this.authService.currentUser()?.usage;
    if (!u || u.master) {
      return 'Ilimitado';
    }
    if (u.maxDirectCnpjPerDay == null) {
      return `${u.directCnpjToday} CNPJs únicos hoje (ilimitado)`;
    }
    return `${u.directCnpjToday} de ${u.maxDirectCnpjPerDay} CNPJs únicos hoje`;
  }

  percentual(atual: number, max: number | null): number {
    if (max == null || max <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((atual / max) * 100));
  }

  formatarData(iso?: string): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  abrirConfirmacaoCancelamento(): void {
    this.erroAssinatura.set('');
    this.mensagemAssinatura.set('');
    this.confirmarCancelamento.set(true);
  }

  fecharConfirmacaoCancelamento(): void {
    this.confirmarCancelamento.set(false);
  }

  cancelarAssinatura(): void {
    if (this.processandoAssinatura()) {
      return;
    }
    this.processandoAssinatura.set(true);
    this.erroAssinatura.set('');
    this.paymentService.cancelarAssinatura().subscribe({
      next: () => {
        this.confirmarCancelamento.set(false);
        this.mensagemAssinatura.set('Renovação cancelada. Seu acesso continua até o fim do período pago.');
        this.processandoAssinatura.set(false);
        this.authService.refreshMe().subscribe({ error: () => {} });
      },
      error: (msg: string) => {
        this.erroAssinatura.set(msg);
        this.processandoAssinatura.set(false);
      }
    });
  }

  reativarAssinatura(): void {
    if (this.processandoAssinatura()) {
      return;
    }
    this.processandoAssinatura.set(true);
    this.erroAssinatura.set('');
    this.paymentService.reativarAssinatura().subscribe({
      next: () => {
        this.mensagemAssinatura.set('Renovação automática reativada.');
        this.processandoAssinatura.set(false);
        this.authService.refreshMe().subscribe({ error: () => {} });
      },
      error: (msg: string) => {
        this.erroAssinatura.set(msg);
        this.processandoAssinatura.set(false);
      }
    });
  }
}
