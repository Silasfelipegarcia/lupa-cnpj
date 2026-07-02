import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {

  email = '';
  erro = signal('');
  sucesso = signal('');
  enviando = signal(false);

  constructor(
    private authService: AuthService,
    private analytics: AnalyticsService
  ) {}

  enviar(): void {
    if (this.enviando()) {
      return;
    }

    this.erro.set('');
    this.sucesso.set('');
    this.enviando.set(true);
    this.analytics.trackPasswordResetRequest();

    this.authService.solicitarResetSenha(this.email.trim()).subscribe({
      next: (mensagem) => {
        this.sucesso.set(mensagem);
        this.enviando.set(false);
        this.analytics.trackPasswordResetRequestSuccess();
      },
      error: (msg: string) => {
        this.analytics.trackPasswordResetRequestError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.enviando.set(false);
      }
    });
  }
}
