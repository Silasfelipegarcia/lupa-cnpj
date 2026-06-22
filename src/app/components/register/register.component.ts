import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  nome = '';
  email = '';
  cpf = '';
  password = '';
  confirmarSenha = '';
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
      return;
    }

    if (this.password !== this.confirmarSenha) {
      this.erro.set('As senhas não coincidem.');
      return;
    }

    const cpfDigits = this.cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      this.erro.set('Informe um CPF válido com 11 dígitos.');
      return;
    }

    this.enviando.set(true);

    this.authService.register({
      nome: this.nome.trim(),
      email: this.email.trim(),
      cpf: cpfDigits,
      password: this.password
    }).subscribe({
      next: () => {
        this.analytics.track('register');
        this.redirecionarAposCadastro();
      },
      error: (msg: string) => {
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
