import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AdminUserSummary } from '../../models/admin.model';
import { SubscriptionPlan } from '../../models/auth.model';
import {
  formatAdminDate,
  formatBrlFromCents,
  formatNumber,
  planLabel
} from '../../utils/admin-format.util';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  usuarios = signal<AdminUserSummary[]>([]);
  carregando = signal(true);
  erro = signal('');
  busca = signal('');
  planoFiltro = signal<SubscriptionPlan | ''>('');
  pagina = signal(0);
  totalPaginas = signal(0);
  totalElementos = signal(0);

  readonly planos: { value: SubscriptionPlan | ''; label: string }[] = [
    { value: '', label: 'Todos os planos' },
    { value: 'FREE', label: 'Free' },
    { value: 'PREMIUM', label: 'Prospecção' },
    { value: 'PRO_PLUS', label: 'Growth' }
  ];

  readonly formatBrlFromCents = formatBrlFromCents;
  readonly formatNumber = formatNumber;
  readonly formatAdminDate = formatAdminDate;
  readonly planLabel = planLabel;

  ngOnInit(): void {
    this.carregar();
  }

  aplicarFiltros(): void {
    this.pagina.set(0);
    this.carregar();
  }

  paginaAnterior(): void {
    if (this.pagina() > 0) {
      this.pagina.update((p) => p - 1);
      this.carregar();
    }
  }

  proximaPagina(): void {
    if (this.pagina() < this.totalPaginas() - 1) {
      this.pagina.update((p) => p + 1);
      this.carregar();
    }
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.adminService.listUsers({
      page: this.pagina(),
      size: 20,
      plan: this.planoFiltro(),
      q: this.busca()
    }).subscribe({
      next: (page) => {
        this.usuarios.set(page.content);
        this.pagina.set(page.page);
        this.totalPaginas.set(page.totalPages);
        this.totalElementos.set(page.totalElements);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar a lista de usuários.');
        this.carregando.set(false);
      }
    });
  }
}
