import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { BrowserNotificationService } from '../../services/browser-notification.service';
import { ImportJobMonitorService } from '../../services/import-job-monitor.service';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';
import { sanitizeAnalyticsError } from '../../utils/analytics-error.util';
import { ImportJobResponse, CnpjResultadoItem } from '../../models/import-job.model';
import { environment } from '../../../environments/environment';
import { buildCnpjResultFields, CnpjResultField } from '../../utils/cnpj-result-fields';
import { AppHeaderComponent } from '../app-header/app-header.component';

const ONBOARDING_KEY = 'lupa_insights_onboarding_visto';
const LEGACY_ONBOARDING_KEY = 'lupa_onboarding_visto';

@Component({
  selector: 'app-cnpj-import',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppHeaderComponent, AnalyticsCtaDirective],
  templateUrl: './cnpj-import.component.html',
  styleUrl: './cnpj-import.component.scss'
})
export class CnpjImportComponent implements OnInit {

  readonly maxFileSizeMb = environment.limits.maxFileSizeMb;
  readonly emTrial = computed(() => !!this.authService.currentUser()?.usage?.emTrial);
  readonly conversaoTrialPendente = computed(() => !!this.authService.currentUser()?.usage?.conversaoTrialPendente);
  readonly trialDiasRestantes = computed(() => this.authService.currentUser()?.usage?.trialDiasRestantes ?? 0);
  readonly planoFree = computed(() => this.authService.currentUser()?.plan === 'FREE');
  readonly dadosLimitados = computed(() => !!this.authService.currentUser()?.usage?.dadosLimitados);

  readonly maxRowsPerFile = computed(() => {
    const usage = this.authService.currentUser()?.usage;
    return usage?.maxRowsPerFile ?? 5;
  });

  readonly usageResumo = computed(() => {
    const user = this.authService.currentUser();
    const usage = user?.usage;
    if (!usage || usage.master) {
      return null;
    }
    const importLimite = usage.maxImportJobsPerDay;
    const importsHoje = usage.importJobsToday ?? 0;
    const directLimite = usage.maxDirectCnpjPerDay;

    return {
      imports: importLimite == null
        ? `${importsHoje} planilhas hoje (ilimitado)`
        : `${importsHoje} de ${importLimite} planilhas hoje`,
      direct: directLimite == null
        ? `${usage.directCnpjToday} CNPJs avulsos hoje (ilimitado)`
        : `${usage.directCnpjToday} de ${directLimite} CNPJs únicos hoje`
    };
  });

  config = signal({
    pesquisaRazaoSocialHabilitada: false,
    exportExcel: false,
    filtroSomenteAtivos: false,
    filtrosAvancados: false,
    dedupeHabilitado: false,
    trialDisponivel: false
  });
  carregandoConfig = signal(true);
  jobAtivo = signal<ImportJobResponse | null>(null);
  cancelando = signal(false);
  mostrarOnboarding = signal(false);

  arquivoSelecionado = signal<File | null>(null);
  mensagem = signal<string>('');
  enviando = signal(false);

  cnpjAvulso = '';
  consultandoAvulso = signal(false);
  resultadoAvulso = signal<CnpjResultadoItem | null>(null);
  erroAvulso = signal('');

  constructor(
    private cnpjImportService: CnpjImportService,
    private router: Router,
    private notificationService: BrowserNotificationService,
    private jobMonitor: ImportJobMonitorService,
    private analytics: AnalyticsService,
    readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem(ONBOARDING_KEY) && localStorage.getItem(LEGACY_ONBOARDING_KEY)) {
      localStorage.setItem(ONBOARDING_KEY, localStorage.getItem(LEGACY_ONBOARDING_KEY)!);
      localStorage.removeItem(LEGACY_ONBOARDING_KEY);
    }
    this.mostrarOnboarding.set(!localStorage.getItem(ONBOARDING_KEY));

    this.authService.refreshMe().subscribe({ error: () => {} });

    this.cnpjImportService.obterJobAtivo().subscribe({
      next: (job) => {
        this.jobAtivo.set(job);
        if (job && (job.status === 'NA_FILA' || job.status === 'PROCESSANDO')) {
          this.jobMonitor.monitorar(job.jobId);
        }
        this.carregarConfiguracao();
      },
      error: () => this.carregarConfiguracao()
    });
  }

  fecharOnboarding(): void {
    localStorage.setItem(ONBOARDING_KEY, '1');
    this.mostrarOnboarding.set(false);
    this.analytics.trackOnboardingDismissed();
  }

  continuarJobAtivo(): void {
    const job = this.jobAtivo();
    if (job) {
      this.analytics.trackResumeJob(job.jobId, 'import_dashboard');
      this.router.navigate(['/consulta', job.jobId]);
    }
  }

  cancelarJobAtivo(): void {
    const job = this.jobAtivo();
    if (!job || this.cancelando()) {
      return;
    }

    this.cancelando.set(true);
    this.mensagem.set('');

    this.cnpjImportService.cancelarImportacao(job.jobId).subscribe({
      next: () => {
        this.analytics.trackCancelImport(job.jobId, 'import_dashboard');
        this.jobAtivo.set(null);
        this.arquivoSelecionado.set(null);
        this.cancelando.set(false);
        this.mensagem.set('Consulta cancelada. Selecione a planilha correta e envie novamente.');
        this.cnpjImportService.invalidarCache('historico');
        this.authService.refreshMe(true).subscribe({ error: () => {} });
      },
      error: (erro: string) => {
        this.cancelando.set(false);
        this.mensagem.set(erro);
        this.analytics.trackCancelImportError(job.jobId, erro, 'import_dashboard');
      }
    });
  }

  private carregarConfiguracao(): void {
    this.cnpjImportService.obterConfiguracao().subscribe({
      next: (config) => {
        this.config.set(config);
        this.carregandoConfig.set(false);
      },
      error: () => this.carregandoConfig.set(false)
    });
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    if (arquivo && arquivo.size > this.maxFileSizeMb * 1024 * 1024) {
      this.arquivoSelecionado.set(null);
      input.value = '';
      this.mensagem.set(`O arquivo excede o limite de ${this.maxFileSizeMb} MB.`);
      this.analytics.trackImportValidationError('file_too_large');
      return;
    }

    this.arquivoSelecionado.set(arquivo);
    this.mensagem.set(arquivo ? `Arquivo selecionado: ${arquivo.name}` : '');
  }

  baixarModelo(): void {
    if (this.enviando()) {
      return;
    }
    this.cnpjImportService.baixarModeloExcel().subscribe({
      next: (blob) => {
        this.cnpjImportService.baixarBlob(blob, 'lupa-insights-modelo.xlsx');
        this.mensagem.set('Modelo Excel baixado. Preencha CNPJ e/ou razão social e importe.');
        this.analytics.trackDownloadTemplate();
      },
      error: (erro: string) => {
        this.mensagem.set(erro);
        this.analytics.trackImportValidationError(erro);
      }
    });
  }

  processar(): void {
    if (this.enviando() || this.jobAtivo()) {
      return;
    }

    const arquivo = this.arquivoSelecionado();
    if (!arquivo) {
      this.mensagem.set('Selecione um arquivo antes de continuar.');
      this.analytics.trackImportValidationError('no_file_selected');
      return;
    }

    const nome = arquivo.name.toLowerCase();
    if (!nome.endsWith('.csv') && !nome.endsWith('.xlsx') && !nome.endsWith('.xls')) {
      this.mensagem.set('O arquivo deve estar no formato CSV ou Excel (.xlsx).');
      this.analytics.trackImportValidationError('invalid_file_type');
      return;
    }

    this.enviando.set(true);
    this.mensagem.set('Enviando arquivo...');

    void this.iniciarProcessamento(arquivo);
  }

  onCnpjAvulsoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 2) {
      this.cnpjAvulso = digits;
    } else if (digits.length <= 5) {
      this.cnpjAvulso = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      this.cnpjAvulso = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length <= 12) {
      this.cnpjAvulso = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else {
      this.cnpjAvulso = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    input.value = this.cnpjAvulso;
  }

  consultarCnpjAvulso(): void {
    if (this.consultandoAvulso()) {
      return;
    }

    const digits = this.cnpjAvulso.replace(/\D/g, '');
    if (digits.length !== 14) {
      this.erroAvulso.set('Informe um CNPJ válido com 14 dígitos.');
      this.analytics.trackCnpjDirectLookupError('validation_cnpj_invalid');
      return;
    }

    this.consultandoAvulso.set(true);
    this.erroAvulso.set('');
    this.resultadoAvulso.set(null);

    this.cnpjImportService.consultarCnpjDireto(digits).subscribe({
      next: (result) => {
        this.resultadoAvulso.set(result);
        this.consultandoAvulso.set(false);
        this.analytics.trackCnpjDirectLookup(digits.length);
        this.authService.refreshMe(true).subscribe({ error: () => {} });
      },
      error: (msg: string) => {
        this.erroAvulso.set(msg);
        this.consultandoAvulso.set(false);
        this.analytics.trackCnpjDirectLookupError(msg);
      }
    });
  }

  camposResultadoAvulso(r: CnpjResultadoItem): CnpjResultField[] {
    return buildCnpjResultFields(r);
  }

  private async iniciarProcessamento(arquivo: File): Promise<void> {
    if (this.notificationService.devePedirPermissao()) {
      await this.notificationService.solicitarPermissao();
    }

    this.cnpjImportService.iniciarImportacao(arquivo).subscribe({
      next: (job) => {
        this.analytics.trackFirstImport(job.jobId, arquivo.name);
        this.cnpjImportService.invalidarCache('historico');
        this.authService.refreshMe(true).subscribe({ error: () => {} });
        this.router.navigate(['/consulta', job.jobId]);
      },
      error: (erro: string) => {
        this.enviando.set(false);
        this.mensagem.set(erro);
        this.analytics.trackImportError(sanitizeAnalyticsError(erro));
      }
    });
  }
}
