import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobStorage } from '../../services/import-job-storage';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cnpj-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cnpj-import.component.html',
  styleUrl: './cnpj-import.component.scss'
})
export class CnpjImportComponent implements OnInit {

  readonly maxFileSizeMb = environment.limits.maxFileSizeMb;
  readonly maxRowsPerFile = environment.limits.maxRowsPerFile;

  arquivoSelecionado = signal<File | null>(null);
  mensagem = signal<string>('');
  enviando = signal(false);

  constructor(
    private cnpjImportService: CnpjImportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const persistido = ImportJobStorage.recuperar();
    if (persistido) {
      this.router.navigate(['/consulta', persistido.jobId]);
    }
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
        this.mensagem.set('Modelo Excel baixado. Preencha e importe o arquivo.');
      },
      error: (erro: string) => this.mensagem.set(erro)
    });
  }

  processar(): void {
    if (this.enviando()) {
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
        ImportJobStorage.salvar({
          jobId: job.jobId,
          arquivo: job.arquivo || arquivo.name
        });
        this.router.navigate(['/consulta', job.jobId]);
      },
      error: (erro: string) => {
        this.enviando.set(false);
        this.mensagem.set(erro);
      }
    });
  }
}
