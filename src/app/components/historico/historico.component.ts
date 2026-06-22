import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobMonitorService } from '../../services/import-job-monitor.service';
import { ImportJobSummary } from '../../models/import-job.model';
import { ListaSalva } from '../../models/cnpj-config.model';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent],
  templateUrl: './historico.component.html',
  styleUrl: './historico.component.scss'
})
export class HistoricoComponent implements OnInit {

  consultas = signal<ImportJobSummary[]>([]);
  listasSalvas = signal<ListaSalva[]>([]);
  busca = signal('');
  carregando = signal(true);
  erro = signal('');
  cancelandoId = signal<string | null>(null);
  reprocessandoId = signal<string | null>(null);

  consultasFiltradas = signal<ImportJobSummary[]>([]);

  constructor(
    private cnpjImportService: CnpjImportService,
    private router: Router,
    private jobMonitor: ImportJobMonitorService
  ) {}

  ngOnInit(): void {
    this.carregarHistorico();
    this.carregarListasSalvas();
  }

  onBuscaChange(valor: string): void {
    this.busca.set(valor);
    this.aplicarBusca();
  }

  private aplicarBusca(): void {
    const termo = this.busca().trim().toLowerCase();
    const items = this.consultas();
    if (!termo) {
      this.consultasFiltradas.set(items);
      return;
    }
    this.consultasFiltradas.set(items.filter((item) => item.arquivo.toLowerCase().includes(termo)));
  }

  carregarHistorico(): void {
    this.carregando.set(true);
    this.cnpjImportService.obterHistorico().subscribe({
      next: (items) => {
        this.consultas.set(items);
        this.consultasFiltradas.set(items);
        this.aplicarBusca();
        this.carregando.set(false);
        const ativo = items.find((item) => this.emAndamento(item.status));
        if (ativo) {
          this.jobMonitor.monitorar(ativo.jobId);
        }
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.carregando.set(false);
      }
    });
  }

  carregarListasSalvas(): void {
    this.cnpjImportService.listarListasSalvas().subscribe({
      next: (listas) => this.listasSalvas.set(listas),
      error: () => {}
    });
  }

  verDetalhes(jobId: string, status: string): void {
    if (this.emAndamento(status)) {
      this.router.navigate(['/consulta', jobId]);
      return;
    }
    this.router.navigate(['/historico', jobId]);
  }

  continuarAcompanhamento(jobId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/consulta', jobId]);
  }

  cancelarConsulta(jobId: string, event: Event): void {
    event.stopPropagation();
    if (this.cancelandoId()) {
      return;
    }

    this.cancelandoId.set(jobId);
    this.erro.set('');

    this.cnpjImportService.cancelarImportacao(jobId).subscribe({
      next: () => {
        this.cancelandoId.set(null);
        this.carregarHistorico();
      },
      error: (msg: string) => {
        this.cancelandoId.set(null);
        this.erro.set(msg);
      }
    });
  }

  reprocessar(jobId: string, event: Event): void {
    event.stopPropagation();
    if (this.reprocessandoId()) {
      return;
    }
    this.reprocessandoId.set(jobId);
    this.cnpjImportService.reprocessar(jobId).subscribe({
      next: (job) => {
        this.reprocessandoId.set(null);
        this.router.navigate(['/consulta', job.jobId]);
      },
      error: (msg: string) => {
        this.reprocessandoId.set(null);
        this.erro.set(msg);
      }
    });
  }

  emAndamento(status: string): boolean {
    return status === 'NA_FILA' || status === 'PROCESSANDO';
  }

  baixarCsv(jobId: string, event: Event): void {
    event.stopPropagation();
    this.cnpjImportService.baixarResultado(jobId).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.cnpjImportService.baixarBlob(blob, `lupa_prospeccao_${timestamp}.csv`);
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
