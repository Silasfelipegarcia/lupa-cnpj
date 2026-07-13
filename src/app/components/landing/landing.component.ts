import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GuestCnpjPreviewService } from '../../services/guest-cnpj-preview.service';
import { CnpjPreviewQuota, CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { LANDING_FAQ } from '../../seo/structured-data';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';
import { CnpjConsultaExperienceComponent } from '../cnpj-consulta/cnpj-consulta-experience.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    AppBrandComponent,
    LegalFooterLinksComponent,
    FormsModule,
    AnalyticsCtaDirective,
    CnpjConsultaExperienceComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  host: { ngSkipHydration: 'true' }
})
export class LandingComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly ano = new Date().getFullYear();

  cnpjInput = '';
  consultando = signal(false);
  erroPreview = signal('');
  resultado = signal<CnpjPreviewResult | null>(null);
  quota = signal<CnpjPreviewQuota | null>(null);

  readonly trustBadges = [
    'Dados oficiais',
    'Consulta gratuita',
    'Atualizado diariamente'
  ];

  readonly personas = [
    {
      perfil: 'Vendedores',
      text: 'Encontre telefone, e-mail e status da empresa antes de ligar — sem perder tempo em sites diferentes.'
    },
    {
      perfil: 'Contadores',
      text: 'Confira dados cadastrais, atividades e status de clientes e fornecedores com rapidez.'
    },
    {
      perfil: 'Consultores',
      text: 'Pesquise dezenas de empresas de uma vez e exporte tudo organizado para seus relatórios.'
    },
    {
      perfil: 'Advogados',
      text: 'Valide razão social, endereço e sócios de empresas em poucos cliques.'
    },
    {
      perfil: 'Empreendedores',
      text: 'Analise concorrentes, parceiros e fornecedores antes de fechar um negócio.'
    },
    {
      perfil: 'Analistas',
      text: 'Monte listas com dados públicos atualizados e filtre o que importa para sua análise.'
    }
  ];

  readonly features = [
    {
      icon: 'search',
      title: 'Pesquise qualquer CNPJ',
      text: 'Digite o número e receba razão social, status, contatos e endereço em segundos.'
    },
    {
      icon: 'bolt',
      title: 'Insights automáticos',
      text: 'Receba análises inteligentes com base nos dados oficiais — sem complicação.'
    },
    {
      icon: 'target',
      title: 'Informação confiável',
      text: 'Dados públicos organizados de forma clara para você decidir com mais segurança.'
    },
    {
      icon: 'folder',
      title: 'Salve e exporte',
      text: 'Guarde suas pesquisas, baixe em Excel e retome de onde parou quando precisar.'
    }
  ];

  readonly steps = [
    { num: '1', title: 'Digite o CNPJ', text: 'Informe os 14 dígitos da empresa que deseja consultar.' },
    { num: '2', title: 'Veja o resultado', text: 'Dados oficiais, insights e análise organizados em cards.' },
    { num: '3', title: 'Desbloqueie mais', text: 'Crie sua conta gratuita para salvar, comparar e exportar.' }
  ];

  readonly faq = LANDING_FAQ;

  readonly pricingPlans = [
    {
      nome: 'Prospecção',
      mensal: 'R$ 9,90/mês',
      anual: '7 dias grátis · R$ 118,80/ano',
      destaque: true
    },
    {
      nome: 'Growth',
      mensal: 'R$ 29,90/mês',
      anual: 'R$ 358,80/ano',
      destaque: false
    }
  ];

  constructor(
    private guestPreviewService: GuestCnpjPreviewService,
    private analytics: AnalyticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.analytics.trackLandingView('home');
      this.carregarQuota();
    }
  }

  get signupQueryParams(): Record<string, string> {
    const params: Record<string, string> = { ref: 'home' };
    const cnpj = this.resultado()?.cnpj ?? this.cnpjInput.trim();
    if (cnpj) {
      params['cnpj'] = cnpj;
    }
    return params;
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
    if (this.consultando() || this.isLoggedIn()) {
      return;
    }

    const digits = this.cnpjInput.replace(/\D/g, '');
    if (digits.length !== 14) {
      this.erroPreview.set('Informe um CNPJ válido com 14 dígitos.');
      this.analytics.trackGuestPreviewError('validation_cnpj_invalid');
      return;
    }

    if (this.quota()?.limiteAtingido) {
      this.erroPreview.set('Você usou sua consulta gratuita. Desbloqueie a análise completa criando uma conta.');
      this.analytics.trackGuestPreviewError('quota_limit_reached');
      return;
    }

    this.analytics.trackCnpjSearch({ landing_variant: 'home' });
    this.consultando.set(true);
    this.erroPreview.set('');
    this.resultado.set(null);

    this.guestPreviewService.consultar(digits).subscribe({
      next: (result) => {
        this.resultado.set(result);
        this.analytics.trackGuestPreview(digits, { landing_variant: 'home' });
        this.quota.set({
          consultasUsadas: result.consultasUsadas,
          consultasLimite: result.consultasLimite,
          consultasRestantes: result.consultasRestantes,
          limiteAtingido: result.consultasRestantes <= 0
        });
        this.consultando.set(false);
        setTimeout(() => this.scrollTo('resultado-consulta'), 100);
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

  registrarDesbloquear(origem: string): void {
    this.analytics.trackCtaClick('desbloquear_gratis', origem);
  }

  irParaCadastro(origem: string): void {
    this.registrarDesbloquear(origem);
    void this.router.navigate(['/cadastro'], { queryParams: this.signupQueryParams });
  }
}
