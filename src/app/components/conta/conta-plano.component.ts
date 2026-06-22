import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PlanCatalogComponent } from '../planos/plan-catalog.component';

@Component({
  selector: 'app-conta-plano',
  standalone: true,
  imports: [PlanCatalogComponent],
  templateUrl: './conta-plano.component.html',
  styleUrl: './conta-plano.component.scss'
})
export class ContaPlanoComponent implements OnInit {
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.refreshMe().subscribe({ error: () => {} });
  }

  usoPlanilha(): string {
    const u = this.authService.currentUser()?.usage;
    if (!u || u.master) {
      return 'Ilimitado';
    }
    const limite = u.maxBatchSearchesPerDay ?? 0;
    return `${u.batchSearchesToday} de ${limite} empresas em planilha hoje`;
  }

  usoCnpj(): string {
    const u = this.authService.currentUser()?.usage;
    if (!u || u.master) {
      return 'Ilimitado';
    }
    if (u.maxDirectCnpjPerDay == null) {
      return `${u.directCnpjToday} CNPJs únicos hoje (ilimitado)`;
    }
    return `${u.directCnpjToday} de ${u.maxDirectCnpjPerDay} CNPJs únicos hoje`;
  }

  percentual(atual: number, max: number | null): number {
    if (max == null || max <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((atual / max) * 100));
  }
}
