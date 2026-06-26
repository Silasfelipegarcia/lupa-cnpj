import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GuestCnpjPreviewService } from '../../services/guest-cnpj-preview.service';
import { buildCnpjResultFields } from '../../utils/cnpj-result-fields';
import { CnpjPreviewCampo, CnpjPreviewQuota, CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';
import { AD_LANDING_CONFIGS, AdLandingConfig } from './ad-landing.config';

@Component({
  selector: 'app-ad-landing',
  standalone: true,
  imports: [RouterLink, LegalFooterLinksComponent, FormsModule, AnalyticsCtaDirective],
  templateUrl: './ad-landing.component.html',
  styleUrl: './ad-landing.component.scss',
  host: { ngSkipHydration: 'true' }
})
export class AdLandingComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly isLoggedIn = this.authService.isLoggedIn;

  config!: AdLandingConfig;

  cnpjInput = '';
  consultando = signal(false);
  erroPreview = signal('');
  resultado = signal<CnpjPreviewResult | null>(null);
  quota = signal<CnpjPreviewQuota | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private guestPreviewService: GuestCnpjPreviewService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.routeConfig?.path ?? '';
    const config = AD_LANDING_CONFIGS[slug];
    if (!config) {
      void this.router.navigateByUrl('/');
      return;
    }
    this.config = config;
    this.analytics.trackLandingView(config.slug);

    if (!this.isLoggedIn()) {
      this.carregarQuota();
    }
  }

  get signupQueryParams(): { ref: string } {
    return { ref: this.config.signupRef };
  }

  scrollToForm(): void {
    document.getElementById('consulta-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('#cnpj-input')?.focus();
    }, 350);
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

    this.analytics.trackCnpjSearch({ landing_variant: this.config.slug });

    if (this.quota()?.limiteAtingido) {
      void this.router.navigate(['/cadastro'], { queryParams: this.signupQueryParams });
      return;
    }

    const digits = this.cnpjInput.replace(/\D/g, '');
    if (digits.length !== 14) {
      this.erroPreview.set('Informe um CNPJ válido com 14 dígitos.');
      this.analytics.trackGuestPreviewError('validation_cnpj_invalid', {
        landing_variant: this.config.slug
      });
      return;
    }

    this.consultando.set(true);
    this.erroPreview.set('');
    this.resultado.set(null);

    this.guestPreviewService.consultar(digits).subscribe({
      next: (result) => {
        this.resultado.set(result);
        this.analytics.trackGuestPreview(digits, { landing_variant: this.config.slug });
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
        this.analytics.trackGuestPreviewError(msg, { landing_variant: this.config.slug });
        this.carregarQuota();
      }
    });
  }

  camposResultado(r: CnpjPreviewResult): CnpjPreviewCampo[] {
    return buildCnpjResultFields(r);
  }

  private carregarQuota(): void {
    this.guestPreviewService.obterQuota().subscribe({
      next: (quota) => this.quota.set(quota),
      error: () => {}
    });
  }
}
