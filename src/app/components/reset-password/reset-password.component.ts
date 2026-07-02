import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  senhaNova = '';
  confirmarSenha = '';
  erro = signal('');
  sucesso = signal(false);
  enviando = signal(false);
  tokenInvalido = signal(false);

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.tokenInvalido.set(true);
      return;
    }
    this.token = token;
  }

  redefinir(): void {
    if (this.enviando() || this.tokenInvalido()) {
      return;
    }

    this.erro.set('');

    if (this.senhaNova.length < 8) {
      this.analytics.trackPasswordResetCompleteError('validation_password_short');
      this.erro.set('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (this.senhaNova !== this.confirmarSenha) {
      this.analytics.trackPasswordResetCompleteError('validation_password_mismatch');
      this.erro.set('As senhas não coincidem.');
      return;
    }

    this.enviando.set(true);

    this.authService.redefinirSenha(this.token, this.senhaNova).subscribe({
      next: () => {
        this.sucesso.set(true);
        this.enviando.set(false);
        this.analytics.trackPasswordResetComplete();
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (msg: string) => {
        this.analytics.trackPasswordResetCompleteError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.enviando.set(false);
        if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('expirado')) {
          this.tokenInvalido.set(true);
        }
      }
    });
  }
}
