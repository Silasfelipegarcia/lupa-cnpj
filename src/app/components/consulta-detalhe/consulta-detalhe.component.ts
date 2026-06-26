import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, timer, switchMap } from 'rxjs';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { BrowserNotificationService } from '../../services/browser-notification.service';
import { ImportJobMonitorService } from '../../services/import-job-monitor.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { AuthService } from '../../services/auth.service';
import { CnpjResultadoItem, ImportJobResponse } from '../../models/import-job.model';
import { environment } from '../../../environments/environment';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-consulta-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppBrandComponent, AppHeaderComponent, AnalyticsCtaDirective],
  templateUrl: './consulta-detalhe.component.html',
  styleUrl: './consulta-detalhe.component.scss'
})
export class ConsultaDetalheComponent implements OnInit, OnDestroy {

  jobId = signal<string>('');
  job = signal<ImportJobResponse | null>(null);
  resultados = signal<CnpjResultadoItem[]>([]);
  config = signal({
    exportExcel: false,
    filtroSomenteAtivos: false,
    filtrosAvancados: false
  });

  somenteAtivos = signal(false);
  filtroUf = signal('');
  filtroCnae = signal('');
  comTelefone = signal(false);
  comEmail = signal(false);

  nomeLista = signal('');
  salvandoLista = signal(false);
  reprocessando = signal(false);

  resultadosFiltrados = computed(() => this.aplicarFiltros(this.resultados()));
  resultadosSucesso = computed(() =>
    this.resultadosFiltrados().filter((item) => item.statusConsulta === 'SUCESSO')
  );
  resultadosErro = computed(() =>
    this.resultados().filter((item) => item.statusConsulta === 'ERRO')
  );

  erro = signal<string>('');
  modoHistorico = signal(false);
  cancelando = signal(false);
  pedindoNotificacao = signal(false);

  private pollingSubscription?: Subscription;
  private unsubscribeMonitor?: () => void;

  readonly irParaNovaConsulta = (): void => this.novaConsulta();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cnpjImportService: CnpjImportService,
    readonly notificationService: BrowserNotificationService,
    private jobMonitor: ImportJobMonitorService,
    private analytics: AnalyticsService,
    readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('jobId');
    if (!id) {
      this.router.navigate(['/app']);
      return;
    }

    const historico = this.route.snapshot.url.some((segment) => segment.path === 'historico');
    this.modoHistorico.set(historico);
    this.jobId.set(id);
    this.carregarConfig();
    this.iniciarAcompanhamento(id);

    this.unsubscribeMonitor = this.jobMonitor.onJobUpdate((jobMonitorado) => {
      const currentId = this.jobId();
      if (!this.modoHistorico() && jobMonitorado.jobId === currentId) {
        this.aplicarJob(jobMonitorado);
      }
    });
  }

  private carregarConfig(): void {
    this.cnpjImportService.obterConfiguracao().subscribe({
      next: (config) => this.config.set(config),
      error: () => {}
    });
  }

  async ativarNotificacoes(): Promise<void> {
    if (this.pedindoNotificacao()) {
      return;
    }
    this.pedindoNotificacao.set(true);
    const granted = await this.notificationService.solicitarPermissao();
    this.analytics.trackNotificationPermissionRequest(granted === 'granted');
    this.pedindoNotificacao.set(false);
  }

  onFiltroAlterado(): void {
    this.analytics.trackApplyFilters(this.jobId(), this.contarFiltrosAtivos());
  }

  baixar(format: 'csv' | 'xlsx'): void {
    const id = this.jobId();
    const filtros = this.montarFiltrosDownload();
    const filterCount = this.contarFiltrosAtivos();
    this.cnpjImportService.baixarResultado(id, format, filtros).subscribe({
      next: (blob) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const ext = format === 'xlsx' ? 'xlsx' : 'csv';
        this.cnpjImportService.baixarBlob(blob, `lupa_insights_prospeccao_${timestamp}.${ext}`);
        this.analytics.trackExport(format, id, filterCount);
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.analytics.trackExportError(id, msg);
      }
    });
  }

  salvarLista(): void {
    const nome = this.nomeLista().trim();
    if (!nome) {
      this.erro.set('Informe um nome para salvar a lista.');
      this.analytics.trackSaveListError(this.jobId(), 'validation_empty_name');
      return;
    }

    this.salvandoLista.set(true);
    this.cnpjImportService.salvarLista(this.jobId(), nome).subscribe({
      next: () => {
        this.salvandoLista.set(false);
        this.analytics.trackSaveList(this.jobId(), nome);
        this.nomeLista.set('');
        this.erro.set('');
        this.cnpjImportService.invalidarCache('listas');
      },
      error: (msg: string) => {
        this.salvandoLista.set(false);
        this.erro.set(msg);
        this.analytics.trackSaveListError(this.jobId(), msg);
      }
    });
  }

  reprocessar(): void {
    if (this.reprocessando()) {
      return;
    }
    this.reprocessando.set(true);
    this.cnpjImportService.reprocessar(this.jobId()).subscribe({
      next: (job) => {
        this.analytics.trackReprocess(this.jobId(), job.jobId);
        this.reprocessando.set(false);
        this.cnpjImportService.invalidarCache('historico');
        this.router.navigate(['/consulta', job.jobId]);
      },
      error: (msg: string) => {
        this.reprocessando.set(false);
        this.erro.set(msg);
        this.analytics.trackReprocessError(this.jobId(), msg);
      }
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
        this.analytics.trackCancelImport(id, 'consulta_detail');
        this.cancelando.set(false);
        this.cnpjImportService.invalidarCache('historico');
        this.router.navigate(['/app']);
      },
      error: (msg: string) => {
        this.cancelando.set(false);
        this.erro.set(msg);
        this.analytics.trackCancelImportError(id, msg, 'consulta_detail');
        this.iniciarAcompanhamento(id);
      }
    });
  }

  private contarFiltrosAtivos(): number {
    let count = 0;
    if (this.somenteAtivos()) count++;
    if (this.filtroUf().trim()) count++;
    if (this.filtroCnae().trim()) count++;
    if (this.comTelefone()) count++;
    if (this.comEmail()) count++;
    return count;
  }

  private montarFiltrosDownload() {
    return {
      somenteAtivos: this.somenteAtivos(),
      uf: this.filtroUf() || undefined,
      cnae: this.filtroCnae() || undefined,
      comTelefone: this.comTelefone(),
      comEmail: this.comEmail()
    };
  }

  private aplicarFiltros(itens: CnpjResultadoItem[]): CnpjResultadoItem[] {
    return itens.filter((item) => {
      if (item.statusConsulta !== 'SUCESSO') {
        return true;
      }
      if (this.somenteAtivos() && !this.isAtiva(item)) {
        return false;
      }
      if (this.filtroUf() && item.uf?.toUpperCase() !== this.filtroUf().toUpperCase()) {
        return false;
      }
      if (this.filtroCnae() && !item.cnaePrincipal?.toUpperCase().includes(this.filtroCnae().toUpperCase())) {
        return false;
      }
      if (this.comTelefone() && !item.telefone1 && !item.telefone2) {
        return false;
      }
      if (this.comEmail() && !item.email) {
        return false;
      }
      return true;
    });
  }

  private isAtiva(item: CnpjResultadoItem): boolean {
    return !!item.situacaoCadastral?.toUpperCase().includes('ATIVA');
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
    this.cnpjImportService.obterHistoricoDetalhe(jobId).subscribe({
      next: (job) => {
        this.aplicarJob(job);
        if (this.emAndamento()) {
          this.iniciarPollingStatus(jobId);
        }
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.pararPollingLocal();
      }
    });
  }

  private iniciarPollingStatus(jobId: string): void {
    this.pollingSubscription = timer(0, environment.limits.statusPollIntervalMs).pipe(
      switchMap(() => this.cnpjImportService.consultarStatus(jobId))
    ).subscribe({
      next: (job) => {
        this.aplicarProgresso(job);
        if (this.jobFinalizado(job.status)) {
          this.pararPollingLocal();
          this.cnpjImportService.invalidarCache('historico');
          this.cnpjImportService.obterHistoricoDetalhe(jobId).subscribe({
            next: (completo) => this.aplicarJob(completo),
            error: () => {}
          });
        }
      },
      error: (msg: string) => {
        this.erro.set(msg);
        this.pararPollingLocal();
      }
    });
  }

  private aplicarProgresso(job: ImportJobResponse): void {
    const atual = this.job();
    this.job.set({
      ...(atual ?? job),
      jobId: job.jobId,
      status: job.status,
      processados: job.processados,
      sucesso: job.sucesso,
      erros: job.erros,
      percentual: job.percentual,
      mensagem: job.mensagem,
      posicaoFila: job.posicaoFila
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
    this.unsubscribeMonitor?.();
  }
}
