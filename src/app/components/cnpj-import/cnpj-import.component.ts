import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CnpjImportService } from '../../services/cnpj-import.service';
import { ImportJobStorage } from '../../services/import-job-storage';

@Component({
  selector: 'app-cnpj-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cnpj-import.component.html',
  styleUrl: './cnpj-import.component.scss'
})
export class CnpjImportComponent implements OnInit {

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
    this.arquivoSelecionado.set(arquivo);
    this.mensagem.set(arquivo ? `Arquivo selecionado: ${arquivo.name}` : '');
  }

  processar(): void {
    const arquivo = this.arquivoSelecionado();
    if (!arquivo) {
      this.mensagem.set('Selecione um arquivo CSV antes de continuar.');
      return;
    }

    if (!arquivo.name.toLowerCase().endsWith('.csv')) {
      this.mensagem.set('O arquivo deve estar no formato CSV.');
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
