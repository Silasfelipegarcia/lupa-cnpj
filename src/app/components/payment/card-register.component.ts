import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { SavedCard } from '../../models/payment.model';

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
  selector: 'app-card-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './card-register.component.html',
  styleUrl: './card-register.component.scss'
})
export class CardRegisterComponent implements OnInit {

  readonly cardSaved = output<SavedCard>();

  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);

  carregando = signal(true);
  salvando = signal(false);
  erro = signal('');
  pronto = signal(false);

  cardNumber = '';
  cardholderName = '';
  expiration = '';
  securityCode = '';

  private mp: { createCardToken: (data: Record<string, string>) => Promise<{ id?: string }> } | null = null;

  ngOnInit(): void {
    this.paymentService.obterConfig().subscribe({
      next: async (config) => {
        if (!config.configured || !config.publicKey) {
          this.erro.set('Pagamentos não configurados no servidor. Defina MERCADOPAGO_PUBLIC_KEY e MERCADOPAGO_ACCESS_TOKEN na API.');
          this.carregando.set(false);
          return;
        }
        try {
          await loadMercadoPago();
          this.mp = new window.MercadoPago(config.publicKey, { locale: 'pt-BR' });
          this.pronto.set(true);
        } catch {
          this.erro.set('Não foi possível carregar o formulário de pagamento.');
        }
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      }
    });
  }

  async salvar(): Promise<void> {
    if (!this.mp || this.salvando()) {
      return;
    }

    const digits = this.cardNumber.replace(/\D/g, '');
    const [month, yearShort] = this.expiration.split('/').map((p) => p.trim());
    const year = yearShort?.length === 2 ? `20${yearShort}` : yearShort;
    const cpf = this.authService.currentUser()?.cpf?.replace(/\D/g, '') ?? '';

    if (digits.length < 13 || !month || !year || this.securityCode.length < 3) {
      this.erro.set('Preencha todos os campos do cartão corretamente.');
      return;
    }

    this.salvando.set(true);
    this.erro.set('');

    try {
      const tokenResult = await this.mp.createCardToken({
        cardNumber: digits,
        cardholderName: this.cardholderName.trim(),
        cardExpirationMonth: month.padStart(2, '0'),
        cardExpirationYear: year,
        securityCode: this.securityCode,
        identificationType: 'CPF',
        identificationNumber: cpf
      });

      const tokenId = tokenResult?.id;
      if (!tokenId) {
        throw new Error('Não foi possível validar o cartão.');
      }

      this.paymentService.salvarCartao(tokenId).subscribe({
        next: (card) => {
          this.cardNumber = '';
          this.cardholderName = '';
          this.expiration = '';
          this.securityCode = '';
          this.salvando.set(false);
          this.cardSaved.emit(card);
        },
        error: (msg: string) => {
          this.erro.set(msg);
          this.salvando.set(false);
        }
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao tokenizar cartão';
      this.erro.set(msg);
      this.salvando.set(false);
    }
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 16);
    digits = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    this.cardNumber = digits;
    input.value = digits;
  }

  onExpirationInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    this.expiration = digits;
    input.value = digits;
  }
}
