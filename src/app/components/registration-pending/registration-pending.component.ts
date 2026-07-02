import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-registration-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent],
  templateUrl: './registration-pending.component.html',
  styleUrl: './registration-pending.component.scss'
})
export class RegistrationPendingComponent implements OnInit {

  email = '';
  erro = signal('');
  sucesso = signal('');
  enviando = signal(false);

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
  }

  reenviar(): void {
    if (this.enviando() || !this.email) {
      return;
    }

    this.erro.set('');
    this.sucesso.set('');
    this.enviando.set(true);

    this.authService.reenviarVerificacao(this.email).subscribe({
      next: (mensagem) => {
        this.sucesso.set(mensagem);
        this.enviando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.enviando.set(false);
        this.analytics.trackSignUpError(sanitizeAnalyticsError(msg));
      }
    });
  }
}
