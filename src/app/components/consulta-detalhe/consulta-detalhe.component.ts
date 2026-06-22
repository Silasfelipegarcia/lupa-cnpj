import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobStorage } from '../../services/import-job-storage';
import { CnpjResultadoItem, ImportJobResponse } from '../../models/import-job.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consulta-detalhe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consulta-detalhe.component.html',
  styleUrl: './consulta-detalhe.component.scss'
})
export class ConsultaDetalheComponent implements OnInit, OnDestroy {

  jobId = signal<string>('');
  job = signal<ImportJobResponse | null>(null);
  resultados = signal<CnpjResultadoItem[]>([]);
  erro = signal<string>('');

  private pollingSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cnpjImportService: CnpjImportService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.jobId.set(id);
    ImportJobStorage.salvar({ jobId: id, arquivo: '' });
    this.iniciarPolling(id);
  }

  baixarCsv(): void {
    const id = this.jobId();
    this.cnpjImportService.baixarResultado(id).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        this.cnpjImportService.baixarBlob(blob, `cnpj_resultado_${timestamp}.csv`);
      },
      error: (msg: string) => this.erro.set(msg)
    });
  }

  emAndamento(): boolean {
    const status = this.job()?.status;
    return status === 'NA_FILA' || status === 'PROCESSANDO';
  }

  concluido(): boolean {
    return this.job()?.status === 'CONCLUIDO';
  }

  novaConsulta(): void {
    ImportJobStorage.limpar();
    this.router.navigate(['/']);
  }

  private iniciarPolling(jobId: string): void {
    this.pollingSubscription = timer(0, environment.limits.statusPollIntervalMs).pipe(
      switchMap(() => this.cnpjImportService.consultarStatus(jobId))
    ).subscribe({
      next: (job) => this.atualizarJob(job),
      error: (msg: string) => {
        this.erro.set(msg);
        ImportJobStorage.limpar();
        this.pararPolling();
      }
    });
  }

  private atualizarJob(job: ImportJobResponse): void {
    this.job.set(job);
    this.resultados.set(job.resultados ?? []);
    ImportJobStorage.salvar({ jobId: job.jobId, arquivo: job.arquivo });

    if (job.status === 'CONCLUIDO' || job.status === 'ERRO') {
      this.pararPolling();
    }
  }

  private pararPolling(): void {
    this.pollingSubscription?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.pararPolling();
  }
}
