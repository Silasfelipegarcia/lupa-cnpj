import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { AdminOverview } from '../../models/admin.model';
import {
  formatAdminDate,
  formatBrlFromCents,
  formatNumber,
  planLabel
} from '../../utils/admin-format.util';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-overview.component.html',
  styleUrl: './admin-overview.component.scss'
})
export class AdminOverviewComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly periodOptions = [7, 30, 90] as const;
  periodDays = signal<number>(30);
  overview = signal<AdminOverview | null>(null);
  carregando = signal(true);
  erro = signal('');

  readonly formatBrlFromCents = formatBrlFromCents;
  readonly formatNumber = formatNumber;
  readonly planLabel = planLabel;
  readonly formatAdminDate = formatAdminDate;

  ngOnInit(): void {
    this.carregar();
  }

  alterarPeriodo(days: number): void {
    this.periodDays.set(days);
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.adminService.getOverview(this.periodDays()).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o painel administrativo.');
        this.carregando.set(false);
      }
    });
  }
}
