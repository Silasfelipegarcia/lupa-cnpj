import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AppBrandComponent } from '../app-brand/app-brand.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, AppBrandComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly authService = inject(AuthService);
  readonly ano = new Date().getFullYear();

  readonly features = [
    {
      icon: '📊',
      title: 'Planilha em, dados completos fora',
      text: 'Envie CSV ou Excel com CNPJs e receba razão social, endereço, telefone, e-mail, CNAE e situação cadastral.'
    },
    {
      icon: '⚡',
      title: 'Acompanhamento em tempo real',
      text: 'Barra de progresso e tabela com resultados parciais enquanto cada CNPJ é consultado.'
    },
    {
      icon: '🔒',
      title: 'Sua conta, suas consultas',
      text: 'Login seguro com JWT. Histórico privado e retomada automática se você sair no meio do processamento.'
    },
    {
      icon: '📁',
      title: 'Histórico e cancelamento',
      text: 'Reabra consultas antigas, baixe resultados quando quiser e cancele para enviar outra planilha.'
    }
  ];

  readonly steps = [
    { num: '1', title: 'Crie sua conta', text: 'Cadastro rápido com nome, e-mail e CPF.' },
    { num: '2', title: 'Envie a planilha', text: 'Colunas cnpj e/ou razao_social — até 900 linhas por arquivo.' },
    { num: '3', title: 'Acompanhe e baixe', text: 'Veja o progresso ao vivo e baixe o CSV enriquecido.' }
  ];

  readonly fields = [
    'CNPJ', 'Razão social', 'Nome fantasia', 'Situação cadastral',
    'Telefones', 'E-mail', 'Endereço completo', 'CNAE principal'
  ];
}
