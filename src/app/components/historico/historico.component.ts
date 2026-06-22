import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobSummary } from '../../models/import-job.model';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, RouterLink, AppHeaderComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent implements OnInit {

  consultas = signal<ImportJobSummary[]>([]);
  carregando = signal(true);
  erro = signal('');

  constructor(
    private cnpjImportService: CnpjImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarHistorico();
  }

  carregarHistorico(): void {
    this.carregando.set(true);
    this.cnpjImportService.obterHistorico().subscribe({
      next: (items) => {
        this.consultas.set(items);
        this.carregando.set(false);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      }
    });
  }

  verDetalhes(jobId: string): void {
    this.router.navigate(['/historico', jobId]);
  }

  baixarCsv(jobId: string, event: Event): void {
    event.stopPropagation();
    this.cnpjImportService.baixarResultado(jobId).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.cnpjImportService.baixarBlob(blob, `cnpj_resultado_${timestamp}.csv`);
      },
      error: (msg: string) => this.erro.set(msg)
    });
  }

  formatarData(iso?: string): string {
    if (!iso) {
      return '—';
    }
    return new Date(iso).toLocaleString('pt-BR');
  }

  rotuloStatus(status: string): string {
    switch (status) {
      case 'NA_FILA': return 'Na fila';
      case 'PROCESSANDO': return 'Processando';
      case 'CONCLUIDO': return 'Concluído';
      case 'CANCELADO': return 'Cancelado';
      case 'ERRO': return 'Erro';
      default: return status;
    }
  }

  podeBaixar(status: string): boolean {
    return status === 'CONCLUIDO' || status === 'CANCELADO';
  }
}
