import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
export class RegisterComponent implements OnInit {

  nome = '';
  email = '';
  cpf = '';
  password = '';
  confirmarSenha = '';
  aceitoTermos = false;
  erro = signal('');
  enviando = signal(false);

  signupRef = '';
  previewCnpj = '';

  readonly trialBenefits = [
    'Importar planilha com dezenas de CNPJs',
    'Exportar resultados em Excel',
    'Sem cartão para começar o trial'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const emailParam = params.get('email');
    if (emailParam) {
      this.email = emailParam;
    }
    this.signupRef = params.get('ref')?.trim() ?? '';
    this.previewCnpj = params.get('cnpj')?.trim() ?? '';
  }

  get tituloCadastro(): string {
    if (this.signupRef === 'consulta-cnpj') {
      return 'Comece seu trial de 7 dias';
    }
    return 'Crie sua conta grátis';
  }

  get subtituloCadastro(): string {
    if (this.signupRef === 'consulta-cnpj' && this.previewCnpj) {
      return `Você consultou ${this.previewCnpj}. Confirme o e-mail e use Prospecção completa — planilhas, Excel e mais consultas.`;
    }
    if (this.signupRef === 'consulta-cnpj') {
      return 'Confirme o e-mail e use Prospecção completa — planilhas, Excel e mais consultas.';
    }
    return '7 dias de Prospecção · sem cartão · ativa ao confirmar o e-mail';
  }

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
    this.analytics.trackSignUpStart({
      signup_ref: this.signupRef || undefined,
      has_preview_cnpj: this.previewCnpj ? '1' : '0'
    });

    this.authService.register({
      nome: this.nome.trim(),
      email: this.email.trim(),
      cpf: cpfDigits,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.router.navigate(['/cadastro-pendente'], {
          queryParams: { email: response.email || this.email.trim() }
        });
      },
      error: (msg: string) => {
        this.analytics.trackSignUpError(sanitizeAnalyticsError(msg));
        this.erro.set(msg);
        this.enviando.set(false);
      }
    });
  }
}
