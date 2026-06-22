import { Component, OnDestroy, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { BrowserNotificationService } from '../../services/browser-notification.service';
import { ImportJobMonitorService } from '../../services/import-job-monitor.service';
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
  cancelando = signal(false);
  pedindoNotificacao = signal(false);

  private pollingSubscription?: Subscription;

  readonly irParaNovaConsulta = (): void => this.novaConsulta();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cnpjImportService: CnpjImportService,
    readonly notificationService: BrowserNotificationService,
    private jobMonitor: ImportJobMonitorService
  ) {
    effect(() => {
      const jobMonitorado = this.jobMonitor.jobAtual();
      const id = this.jobId();
      if (!this.modoHistorico() && jobMonitorado && jobMonitorado.jobId === id) {
        this.aplicarJob(jobMonitorado);
      }
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (!id) {
      this.router.navigate(['/app']);
      return;
    }

    const historico = this.route.snapshot.url.some((segment) => segment.path === 'historico');
    this.modoHistorico.set(historico);
    this.jobId.set(id);
    this.iniciarAcompanhamento(id);
  }

  async ativarNotificacoes(): Promise<void> {
    if (this.pedindoNotificacao()) {
      return;
    }
    this.pedindoNotificacao.set(true);
    await this.notificationService.solicitarPermissao();
    this.pedindoNotificacao.set(false);
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
    this.router.navigate(['/app']);
  }

  novaConsulta(): void {
    if (this.emAndamento()) {
      this.cancelarEEnviarOutro();
      return;
    }
    this.jobMonitor.parar();
    this.router.navigate(['/app']);
  }

  cancelarEEnviarOutro(): void {
    const id = this.jobId();
    if (!id || this.cancelando() || !this.emAndamento()) {
      return;
    }

    this.cancelando.set(true);
    this.jobMonitor.parar();
    this.pararPollingLocal();

    this.cnpjImportService.cancelarImportacao(id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.router.navigate(['/app']);
      },
      error: (msg: string) => {
        this.cancelando.set(false);
        this.erro.set(msg);
        this.iniciarAcompanhamento(id);
      }
    });
  }

  private iniciarAcompanhamento(jobId: string): void {
    if (this.modoHistorico()) {
      this.iniciarPollingHistorico(jobId);
      return;
    }

    this.jobMonitor.monitorar(jobId);
    const jobAtual = this.jobMonitor.jobAtual();
    if (jobAtual?.jobId === jobId) {
      this.aplicarJob(jobAtual);
    }
  }

  private iniciarPollingHistorico(jobId: string): void {
    const consulta = () => this.cnpjImportService.obterHistoricoDetalhe(jobId);

    this.pollingSubscription = timer(0, environment.limits.statusPollIntervalMs).pipe(
      switchMap(consulta)
    ).subscribe({
      next: (job) => this.aplicarJob(job),
      error: (msg: string) => {
        this.erro.set(msg);
        this.pararPollingLocal();
      }
    });
  }

  private aplicarJob(job: ImportJobResponse): void {
    this.job.set(job);
    this.resultados.set(job.resultados ?? []);

    if (this.modoHistorico() && this.jobFinalizado(job.status)) {
      this.pararPollingLocal();
    }
  }

  private jobFinalizado(status: string): boolean {
    return status === 'CONCLUIDO' || status === 'ERRO' || status === 'CANCELADO';
  }

  private pararPollingLocal(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  ngOnDestroy(): void {
    this.pararPollingLocal();
  }
}
