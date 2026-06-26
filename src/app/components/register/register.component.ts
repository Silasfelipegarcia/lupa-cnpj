import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { LegalFooterLinksComponent } from '../legal-footer-links/legal-footer-links.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, LegalFooterLinksComponent, AnalyticsCtaDirective],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  nome = '';
  email = '';
  cpf = '';
  password = '';
  confirmarSenha = '';
  aceitoTermos = false;
  erro = signal('');
  enviando = signal(false);

  constructor(
    private authService: AuthService,
    private cnpjImportService: CnpjImportService,
    private router: Router,
    private analytics: AnalyticsService
  ) {}

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) {
      this.cpf = digits;
    } else if (digits.length <= 6) {
      this.cpf = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      this.cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
      this.cpf = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    input.value = this.cpf;
  }

  cadastrar(): void {
    if (this.enviando()) {
      return;
    }

    this.erro.set('');

    if (this.password.length < 8) {
      this.erro.set('A senha deve ter no mínimo 8 caracteres.');
      this.analytics.trackSignUpError('validation_password_short');
      return;
    }

    if (this.password !== this.confirmarSenha) {
      this.erro.set('As senhas não coincidem.');
      this.analytics.trackSignUpError('validation_password_mismatch');
      return;
    }

    if (!this.aceitoTermos) {
      this.erro.set('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      this.analytics.trackSignUpError('validation_terms_required');
      return;
    }

    const cpfDigits = this.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      this.erro.set('Informe um CPF válido com 11 dígitos.');
      this.analytics.trackSignUpError('validation_cpf_invalid');
      return;
    }

    this.enviando.set(true);
    this.analytics.trackSignUpStart();

    this.authService.register({
      nome: this.nome.trim(),
      email: this.email.trim(),
      cpf: cpfDigits,
      password: this.password
    }).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user) {
          this.analytics.trackSignUp(user.id, user.plan);
        }
        this.redirecionarAposCadastro();
      },
      error: (msg: string) => {
        this.analytics.trackSignUpError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.enviando.set(false);
      }
    });
  }

  private redirecionarAposCadastro(): void {
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
