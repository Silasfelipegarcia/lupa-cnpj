import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { PaymentHistoryItem } from '../../models/payment.model';

@Component({
  selector: 'app-conta-cobranca',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conta-cobranca.component.html',
  styleUrl: './conta-cobranca.component.scss'
})
export class ContaCobrancaComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);

  carregando = signal(true);
  historico = signal<PaymentHistoryItem[]>([]);
  erro = signal('');

  ngOnInit(): void {
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
}
