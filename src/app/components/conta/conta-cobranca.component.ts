import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
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
  readonly authService = inject(AuthService);

  carregando = signal(true);
  historico = signal<PaymentHistoryItem[]>([]);
  cartoes = signal<SavedCard[]>([]);
  erro = signal('');
  mostrarFormulario = signal(false);
  removendo = signal<string | null>(null);

  ngOnInit(): void {
    this.authService.refreshMe().subscribe({ error: () => {} });
    this.recarregar();
  }

  recarregar(): void {
    this.carregando.set(true);
    this.erro.set('');

    this.paymentService.listarCartoes().subscribe({
      next: (cards) => {
        this.cartoes.set(cards);
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
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.removendo.set(null);
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
    return this.authService.currentUser()?.subscription?.defaultCardId === cardId;
  }

  renovacaoAtiva(): boolean {
    const sub = this.authService.currentUser()?.subscription;
    return !!sub?.autoRenew && sub.status === 'ACTIVE';
  }
}
