import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GuestCnpjPreviewService } from '../../services/guest-cnpj-preview.service';
import { CnpjPreviewCampo, CnpjPreviewQuota, CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, AppBrandComponent, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly ano = new Date().getFullYear();

  cnpjInput = '';
  consultando = signal(false);
  erroPreview = signal('');
  resultado = signal<CnpjPreviewResult | null>(null);
  quota = signal<CnpjPreviewQuota | null>(null);

  readonly features = [
    {
      icon: '📊',
      title: 'Planilha em, dados completos fora',
      text: 'Envie CSV ou Excel com CNPJs e receba razão social, endereço, telefone, e-mail, CNAE e situação cadastral.'
    },
    {
      icon: '⚡',
      title: 'Acompanhamento em tempo real',
      text: 'Barra de progresso e tabela com resultados parciais enquanto cada CNPJ é consultado.'
    },
    {
      icon: '🔒',
      title: 'Sua conta, suas consultas',
      text: 'Login seguro com JWT. Histórico privado e retomada automática se você sair no meio do processamento.'
    },
    {
      icon: '📁',
      title: 'Histórico e cancelamento',
      text: 'Reabra consultas antigas, baixe resultados quando quiser e cancele para enviar outra planilha.'
    }
  ];

  readonly steps = [
    { num: '1', title: 'Crie sua conta', text: 'Cadastro rápido com nome, e-mail e CPF.' },
    { num: '2', title: 'Envie a planilha', text: 'Colunas cnpj e/ou razao_social — de 10 a 900 linhas conforme o plano.' },
    { num: '3', title: 'Acompanhe e baixe', text: 'Veja o progresso ao vivo e baixe o CSV enriquecido.' }
  ];

  readonly fields = [
    'CNPJ', 'Razão social', 'Nome fantasia', 'Situação cadastral',
    'Telefones', 'E-mail', 'Endereço completo', 'CNAE principal'
  ];

  constructor(private guestPreviewService: GuestCnpjPreviewService) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.carregarQuota();
    }
  }

  onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) {
      this.cnpjInput = digits;
    } else if (digits.length <= 5) {
      this.cnpjInput = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      this.cnpjInput = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length <= 12) {
      this.cnpjInput = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else {
      this.cnpjInput = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    input.value = this.cnpjInput;
  }

  consultarCnpj(): void {
    if (this.consultando() || this.authService.isAuthenticated()) {
      return;
    }

    const digits = this.cnpjInput.replace(/\D/g, '');
    if (digits.length !== 14) {
      this.erroPreview.set('Informe um CNPJ válido com 14 dígitos.');
      return;
    }

    if (this.quota()?.limiteAtingido) {
      this.erroPreview.set('Você usou sua consulta gratuita. Crie uma conta para continuar.');
      return;
    }

    this.consultando.set(true);
    this.erroPreview.set('');
    this.resultado.set(null);

    this.guestPreviewService.consultar(digits).subscribe({
      next: (result) => {
        this.resultado.set(result);
        this.quota.set({
          consultasUsadas: result.consultasUsadas,
          consultasLimite: result.consultasLimite,
          consultasRestantes: result.consultasRestantes,
          limiteAtingido: result.consultasRestantes <= 0
        });
        this.consultando.set(false);
      },
      error: (msg: string) => {
        this.erroPreview.set(msg);
        this.consultando.set(false);
        this.carregarQuota();
      }
    });
  }

  private carregarQuota(): void {
    this.guestPreviewService.obterQuota().subscribe({
      next: (quota) => this.quota.set(quota),
      error: () => {}
    });
  }

  camposResultado(r: CnpjPreviewResult): CnpjPreviewCampo[] {
    const telefones = [r.telefone1, r.telefone2].filter((t) => t && t.trim()).join(' · ');
    const endereco = [
      [r.logradouro, r.numero].filter(Boolean).join(', '),
      r.complemento,
      r.bairro,
      [r.cidade, r.uf].filter(Boolean).join('/'),
      r.cep
    ].filter((parte) => parte && parte.trim()).join(' — ');

    return [
      { label: 'Razão social', valor: r.razaoSocial },
      { label: 'Nome fantasia', valor: r.nomeFantasia || '—' },
      { label: 'Situação cadastral', valor: r.situacaoCadastral || '—' },
      { label: 'Telefones', valor: telefones || '—' },
      { label: 'E-mail', valor: r.email || '—' },
      { label: 'Endereço', valor: endereco || '—' },
      { label: 'CNAE principal', valor: r.cnaePrincipal || '—' }
    ];
  }
}
