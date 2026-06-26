import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent, AnalyticsCtaDirective],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  email = '';
  password = '';
  erro = signal('');
  enviando = signal(false);

  constructor(
    private authService: AuthService,
    private cnpjImportService: CnpjImportService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('sessaoExpirada') === '1') {
      this.erro.set('Sua sessão expirou. Faça login novamente para continuar.');
      this.analytics.trackSessionExpiredView();
    } else if (this.route.snapshot.queryParamMap.get('ambiente') === '1') {
      this.erro.set('Você trocou de ambiente (local ↔ produção). Faça login novamente nesta API.');
    }
  }

  entrar(): void {
    if (this.enviando()) {
      return;
    }

    this.erro.set('');
    this.enviando.set(true);
    this.analytics.trackLoginFormStart();

    this.authService.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) {
          this.analytics.trackLogin(user.id, user.plan);
        }
        this.redirecionarAposLogin();
      },
      error: (msg: string) => {
        this.analytics.trackLoginError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.enviando.set(false);
      }
    });
  }

  private redirecionarAposLogin(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (redirect && redirect.startsWith('/')) {
      this.router.navigateByUrl(redirect);
      return;
    }

    this.cnpjImportService.obterJobAtivo().subscribe({
      next: (job) => {
        if (job) {
          this.router.navigate(['/consulta', job.jobId]);
          return;
        }
        this.router.navigate(['/app']);
      },
      error: () => this.router.navigate(['/app'])
    });
  }
}
