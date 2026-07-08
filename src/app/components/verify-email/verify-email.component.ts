import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss'
})
export class VerifyEmailComponent implements OnInit {

  erro = signal('');
  verificando = signal(true);
  sucesso = signal(false);
  tokenInvalido = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cnpjImportService: CnpjImportService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenInvalido.set(true);
      this.verificando.set(false);
      return;
    }

    this.authService.verificarEmail(token).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) {
          this.analytics.trackSignUp(user.id, user.plan);
          if (user.usage?.emTrial) {
            this.analytics.trackTrialStart('PREMIUM');
          }
        }
        this.sucesso.set(true);
        this.verificando.set(false);
        setTimeout(() => this.redirecionarAposVerificacao(), 1500);
      },
      error: (msg: string) => {
        this.analytics.trackSignUpError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.verificando.set(false);
        if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('expirado')) {
          this.tokenInvalido.set(true);
        }
      }
    });
  }

  private redirecionarAposVerificacao(): void {
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
