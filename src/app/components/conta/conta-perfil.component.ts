import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-conta-perfil',
  standalone: true,
  templateUrl: './conta-perfil.component.html',
  styleUrl: './conta-perfil.component.scss'
})
export class ContaPerfilComponent {
  readonly authService = inject(AuthService);

  formatarCpf(cpf?: string): string {
    if (!cpf || cpf.length !== 11) {
      return cpf ?? '—';
    }
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
