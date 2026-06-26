import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-conta-perfil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './conta-perfil.component.html',
  styleUrl: './conta-perfil.component.scss'
})
export class ContaPerfilComponent implements OnInit {
  readonly authService = inject(AuthService);

  senhaAtual = '';
  senhaNova = '';
  confirmarSenha = '';
  salvandoSenha = signal(false);
  erroSenha = signal('');
  mensagemSenha = signal('');

  ngOnInit(): void {
    this.authService.refreshMe().subscribe({ error: () => {} });
  }

  formatarCpf(cpf?: string): string {
    if (!cpf || cpf.length !== 11) {
      return cpf ?? '—';
    }
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatarData(iso?: string): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  alterarSenha(): void {
    if (this.salvandoSenha()) {
      return;
    }

    this.erroSenha.set('');
    this.mensagemSenha.set('');

    if (!this.senhaAtual.trim()) {
      this.erroSenha.set('Informe a senha atual.');
      return;
    }
    if (this.senhaNova.length < 8) {
      this.erroSenha.set('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (this.senhaNova !== this.confirmarSenha) {
      this.erroSenha.set('A confirmação não coincide com a nova senha.');
      return;
    }

    this.salvandoSenha.set(true);
    this.authService.alterarSenha({
      senhaAtual: this.senhaAtual,
      senhaNova: this.senhaNova
    }).subscribe({
      next: () => {
        this.senhaAtual = '';
        this.senhaNova = '';
        this.confirmarSenha = '';
        this.mensagemSenha.set('Senha alterada com sucesso.');
        this.salvandoSenha.set(false);
      },
      error: (msg: string) => {
        this.erroSenha.set(msg);
        this.salvandoSenha.set(false);
      }
    });
  }
}
