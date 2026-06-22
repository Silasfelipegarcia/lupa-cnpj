import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobResponse } from '../../models/import-job.model';
import { environment } from '../../../environments/environment';
import { AppHeaderComponent } from '../app-header/app-header.component';

@Component({
  selector: 'app-cnpj-import',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent],
  templateUrl: './cnpj-import.component.html',
  styleUrl: './cnpj-import.component.scss'
})
export class CnpjImportComponent implements OnInit {

  readonly maxFileSizeMb = environment.limits.maxFileSizeMb;
  readonly maxRowsPerFile = environment.limits.maxRowsPerFile;

  pesquisaRazaoSocialHabilitada = signal(false);
  carregandoConfig = signal(true);
  jobAtivo = signal<ImportJobResponse | null>(null);
  cancelando = signal(false);

  arquivoSelecionado = signal<File | null>(null);
  mensagem = signal<string>('');
  enviando = signal(false);

  constructor(
    private cnpjImportService: CnpjImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cnpjImportService.obterJobAtivo().subscribe({
      next: (job) => {
        this.jobAtivo.set(job);
        this.carregarConfiguracao();
      },
      error: () => this.carregarConfiguracao()
    });
  }

  continuarJobAtivo(): void {
    const job = this.jobAtivo();
    if (job) {
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
        this.jobAtivo.set(null);
        this.arquivoSelecionado.set(null);
        this.cancelando.set(false);
        this.mensagem.set('Consulta cancelada. Selecione a planilha correta e envie novamente.');
      },
      error: (erro: string) => {
        this.cancelando.set(false);
        this.mensagem.set(erro);
      }
    });
  }

  private carregarConfiguracao(): void {
    this.cnpjImportService.obterConfiguracao().subscribe({
      next: (config) => {
        this.pesquisaRazaoSocialHabilitada.set(config.pesquisaRazaoSocialHabilitada);
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
        this.cnpjImportService.baixarBlob(blob, 'lupa-cnpj-modelo.xlsx');
        this.mensagem.set('Modelo Excel baixado. Preencha a coluna CNPJ e importe o arquivo.');
      },
      error: (erro: string) => this.mensagem.set(erro)
    });
  }

  processar(): void {
    if (this.enviando() || this.jobAtivo()) {
      return;
    }

    const arquivo = this.arquivoSelecionado();
    if (!arquivo) {
      this.mensagem.set('Selecione um arquivo antes de continuar.');
      return;
    }

    const nome = arquivo.name.toLowerCase();
    if (!nome.endsWith('.csv') && !nome.endsWith('.xlsx') && !nome.endsWith('.xls')) {
      this.mensagem.set('O arquivo deve estar no formato CSV ou Excel (.xlsx).');
      return;
    }

    this.enviando.set(true);
    this.mensagem.set('Enviando arquivo...');

    this.cnpjImportService.iniciarImportacao(arquivo).subscribe({
      next: (job) => {
        this.router.navigate(['/consulta', job.jobId]);
      },
      error: (erro: string) => {
        this.enviando.set(false);
        this.mensagem.set(erro);
      }
    });
  }
}
