import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AdminUserDetail } from '../../models/admin.model';
import {
  formatAdminDate,
  formatAdminDateTime,
  formatBrlFromCents,
  formatNumber,
  planLabel
} from '../../utils/admin-format.util';

@Component({
  selector: 'app-admin-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-user-detail.component.html',
  styleUrl: './admin-user-detail.component.scss'
})
export class AdminUserDetailComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  usuario = signal<AdminUserDetail | null>(null);
  carregando = signal(true);
  erro = signal('');

  readonly formatBrlFromCents = formatBrlFromCents;
  readonly formatNumber = formatNumber;
  readonly formatAdminDate = formatAdminDate;
  readonly formatAdminDateTime = formatAdminDateTime;
  readonly planLabel = planLabel;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.erro.set('Usuário inválido.');
      this.carregando.set(false);
      return;
    }
    this.adminService.getUserDetail(id).subscribe({
      next: (data) => {
        this.usuario.set(data);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os detalhes do usuário.');
        this.carregando.set(false);
      }
    });
  }
}
