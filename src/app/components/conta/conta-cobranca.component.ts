import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PaymentHistoryItem, SavedCard } from '../../models/payment.model';
import { CardRegisterComponent } from '../payment/card-register.component';

@Component({
  selector: 'app-conta-cobranca',
  standalone: true,
  imports: [CommonModule, CardRegisterComponent],
  templateUrl: './conta-cobranca.component.html',
  styleUrl: './conta-cobranca.component.scss'
})
export class ContaCobrancaComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly analytics = inject(AnalyticsService);
  readonly authService = inject(AuthService);

  carregando = signal(true);
  historico = signal<PaymentHistoryItem[]>([]);
  cartoes = signal<SavedCard[]>([]);
  erro = signal('');
  avisoTrial = signal(false);
  mostrarFormulario = signal(false);
  removendo = signal<string | null>(null);

  ngOnInit(): void {
    this.avisoTrial.set(this.route.snapshot.queryParamMap.get('trial') === '1');
    if (this.avisoTrial()) {
      this.analytics.trackTrialCardPromptView();
    }
    this.authService.refreshMe().subscribe({ error: () => {} });
    this.recarregar();
  }

  abrirFormularioCartao(): void {
    this.mostrarFormulario.set(true);
    this.analytics.trackBeginCardRegister();
  }

  recarregar(): void {
    this.carregando.set(true);
    this.erro.set('');

    this.paymentService.listarCartoes().subscribe({
      next: (cards) => {
        this.cartoes.set(cards);
        this.authService.refreshMe().subscribe({ error: () => {} });
        this.paymentService.listarHistorico().subscribe({
          next: (items) => {
            this.historico.set(items);
            this.carregando.set(false);
          },
          error: (msg: string) => {
            this.erro.set(msg);
            this.carregando.set(false);
          }
        });
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      }
    });
  }

  onCartaoSalvo(card: SavedCard): void {
    this.cartoes.update((lista) => {
      const filtrada = lista.filter((c) => c.id !== card.id);
      return [card, ...filtrada];
    });
    this.mostrarFormulario.set(false);
    this.analytics.trackCardSaved();
    this.authService.refreshMe().subscribe({ error: () => {} });
  }

  removerCartao(cardId: string): void {
    if (this.removendo()) {
      return;
    }
    const sub = this.authService.currentUser()?.subscription;
    if (sub?.autoRenew && sub.defaultCardId === cardId) {
      const ok = confirm(
        'Este é o cartão usado na renovação automática. Removê-lo pode impedir a próxima cobrança. Deseja continuar?'
      );
      if (!ok) {
        return;
      }
    }
    this.removendo.set(cardId);
    this.paymentService.removerCartao(cardId).subscribe({
      next: () => {
        this.cartoes.update((lista) => lista.filter((c) => c.id !== cardId));
        this.removendo.set(null);
        this.analytics.trackCardRemoved();
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.removendo.set(null);
        this.analytics.trackCardRemovedError(msg);
      }
    });
  }

  rotuloBandeira(brand: string): string {
    if (!brand) {
      return 'Cartão';
    }
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  }

  formatarData(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR');
  }

  classeStatus(status: string): string {
    const s = status?.toUpperCase() ?? '';
    if (s === 'APPROVED') {
      return 'status-concluido';
    }
    if (s === 'PENDING') {
      return 'status-processando';
    }
    return 'status-erro';
  }

  isCartaoPadrao(cardId: string): boolean {
    const card = this.cartoes().find((c) => c.id === cardId);
    if (card?.defaultCard) {
      return true;
    }
    return this.authService.currentUser()?.subscription?.defaultCardId === cardId;
  }

  mostrarRenovacaoAutomatica(cardId: string): boolean {
    const sub = this.authService.currentUser()?.subscription;
    if (!sub?.autoRenew || sub.status !== 'ACTIVE') {
      return false;
    }
    return this.isCartaoPadrao(cardId);
  }

  renovacaoAtiva(): boolean {
    const sub = this.authService.currentUser()?.subscription;
    return !!sub?.autoRenew && sub.status === 'ACTIVE';
  }
}
