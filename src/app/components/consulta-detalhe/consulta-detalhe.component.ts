import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { CnpjResultadoItem, ImportJobResponse } from '../../models/import-job.model';
import { environment } from '../../../environments/environment';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-consulta-detalhe',
  standalone: true,
  imports: [CommonModule, AppBrandComponent, AppHeaderComponent],
  templateUrl: './consulta-detalhe.component.html',
  styleUrl: './consulta-detalhe.component.scss'
})
export class ConsultaDetalheComponent implements OnInit, OnDestroy {

  jobId = signal<string>('');
  job = signal<ImportJobResponse | null>(null);
  resultados = signal<CnpjResultadoItem[]>([]);
  resultadosSucesso = computed(() =>
    this.resultados().filter((item) => item.statusConsulta === 'SUCESSO')
  );
  resultadosErro = computed(() =>
    this.resultados().filter((item) => item.statusConsulta === 'ERRO')
  );
  erro = signal<string>('');
  modoHistorico = signal(false);

  private pollingSubscription?: Subscription;

  readonly irParaNovaConsulta = (): void => this.novaConsulta();

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

    const historico = this.route.snapshot.url.some((segment) => segment.path === 'historico');
    this.modoHistorico.set(historico);
    this.jobId.set(id);
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
    const status = this.job()?.status;
    return status === 'CONCLUIDO' || status === 'CANCELADO';
  }

  cancelado(): boolean {
    return this.job()?.status === 'CANCELADO';
  }

  voltar(): void {
    if (this.modoHistorico()) {
      this.router.navigate(['/historico']);
      return;
    }
    this.router.navigate(['/']);
  }

  novaConsulta(): void {
    const id = this.jobId();
    const ativo = this.emAndamento() && !this.modoHistorico();

    this.pararPolling();

    if (ativo && id) {
      this.cnpjImportService.cancelarImportacao(id).subscribe({
        error: () => undefined
      });
    }

    this.router.navigate(['/']);
  }

  private iniciarPolling(jobId: string): void {
    const consulta = this.modoHistorico()
      ? () => this.cnpjImportService.obterHistoricoDetalhe(jobId)
      : () => this.cnpjImportService.consultarStatus(jobId);

    this.pollingSubscription = timer(0, environment.limits.statusPollIntervalMs).pipe(
      switchMap(consulta)
    ).subscribe({
      next: (job) => this.atualizarJob(job),
      error: (msg: string) => {
        this.erro.set(msg);
        this.pararPolling();
      }
    });
  }

  private atualizarJob(job: ImportJobResponse): void {
    this.job.set(job);
    this.resultados.set(job.resultados ?? []);

    if (job.status === 'CONCLUIDO' || job.status === 'ERRO' || job.status === 'CANCELADO') {
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
