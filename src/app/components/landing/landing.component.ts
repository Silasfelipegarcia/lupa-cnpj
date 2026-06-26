import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GuestCnpjPreviewService } from '../../services/guest-cnpj-preview.service';
import { buildCnpjResultFields } from '../../utils/cnpj-result-fields';
import { CnpjPreviewCampo, CnpjPreviewQuota, CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { LANDING_FAQ } from '../../seo/structured-data';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, AppBrandComponent, LegalFooterLinksComponent, FormsModule, AnalyticsCtaDirective],
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

  readonly stats = [
    { value: '1', label: 'consulta completa grátis', sub: 'sem cadastro' },
    { value: '1', label: 'planilha/dia no Free', sub: 'até 5 linhas' },
    { value: 'Excel', label: 'export no Prospecção', sub: 'pronto pro CRM' }
  ];

  readonly personas = [
    {
      tag: 'SDR / pré-vendas',
      title: 'Lista limpa para ligar hoje',
      text: 'Filtre só empresas ativas, exporte com telefone e e-mail e comece o outreach sem planilha manual.'
    },
    {
      tag: 'Agência / consultoria',
      title: 'Volume com histórico',
      text: 'Salve listas por campanha, reprocesse com dados atualizados e dedupe CNPJs duplicados no Growth.'
    },
    {
      tag: 'Rep comercial',
      title: 'Valide o lead em segundos',
      text: 'Consulta avulsa por CNPJ ou importe a lista do CRM — dados cadastrais oficiais em minutos.'
    }
  ];

  readonly features = [
    {
      icon: 'target',
      title: 'Lista pronta para prospecção',
      text: 'Filtre empresas ativas, exporte em Excel e leve direto para o CRM — sem retrabalho pós-export.'
    },
    {
      icon: 'search',
      title: 'CNPJ ou razão social',
      text: 'Importe planilhas com CNPJ, nome da empresa ou misto. No plano Prospecção+, busca por razão social.'
    },
    {
      icon: 'bolt',
      title: 'Acompanhamento em tempo real',
      text: 'Barra de progresso e tabela com resultados parciais enquanto cada empresa é qualificada.'
    },
    {
      icon: 'folder',
      title: 'Histórico e listas salvas',
      text: 'Reabra consultas, salve listas para campanhas e reprocesse com dados atualizados.'
    }
  ];

  readonly steps = [
    { num: '1', title: 'Importe sua lista', text: 'CSV ou Excel com CNPJ e/ou razão social.' },
    { num: '2', title: 'Enriqueça e filtre', text: 'Dados oficiais + filtro de empresas ativas (Prospecção+).' },
    { num: '3', title: 'Exporte e prospecte', text: 'Baixe CSV ou Excel e comece o outreach hoje.' }
  ];

  readonly compare = {
    before: ['Planilha suja com nomes errados', 'Consulta manual empresa por empresa', 'Lista cheia de inaptas', 'Copy-paste para o CRM'],
    after: ['Dados oficiais em lote', 'Filtro só empresas ATIVAS', 'Telefone, e-mail e CNAE', 'Export Excel em 1 clique']
  };

  readonly faq = LANDING_FAQ;

  readonly fields = [
    'CNPJ', 'Razão social', 'Nome fantasia', 'Situação cadastral',
    'Telefones', 'E-mail', 'Endereço completo', 'CNAE principal'
  ];

  constructor(
    private guestPreviewService: GuestCnpjPreviewService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.carregarQuota();
    }
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      this.analytics.trackGuestPreviewError('validation_cnpj_invalid');
      return;
    }

    if (this.quota()?.limiteAtingido) {
      this.erroPreview.set('Você usou sua consulta gratuita. Crie uma conta para continuar.');
      this.analytics.trackGuestPreviewError('quota_limit_reached');
      return;
    }

    this.consultando.set(true);
    this.erroPreview.set('');
    this.resultado.set(null);

    this.guestPreviewService.consultar(digits).subscribe({
      next: (result) => {
        this.resultado.set(result);
        this.analytics.trackGuestPreview(digits);
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
        this.analytics.trackGuestPreviewError(msg);
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
    return buildCnpjResultFields(r);
  }
}
