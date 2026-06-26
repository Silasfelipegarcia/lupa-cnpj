import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, switchMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImportJobResponse } from '../models/import-job.model';
import { BrowserNotificationService } from './browser-notification.service';
import { CnpjImportService } from './cnpj-import.service';

type JobUpdateListener = (job: ImportJobResponse) => void;

@Injectable({ providedIn: 'root' })
export class ImportJobMonitorService {

  readonly jobAtual = signal<ImportJobResponse | null>(null);

  private pollingSubscription?: Subscription;
  private jobIdMonitorado?: string;
  private notificacaoEnviada = false;
  private readonly listeners = new Set<JobUpdateListener>();

  constructor(
    private cnpjImportService: CnpjImportService,
    private notificationService: BrowserNotificationService,
    private router: Router
  ) {}

  monitorar(jobId: string): void {
    if (this.jobIdMonitorado === jobId && this.pollingSubscription) {
      return;
    }

    this.parar();
    this.jobIdMonitorado = jobId;
    this.notificacaoEnviada = false;

    this.pollingSubscription = timer(0, environment.limits.statusPollIntervalMs).pipe(
      switchMap(() => this.cnpjImportService.consultarStatus(jobId))
    ).subscribe({
      next: (job) => this.processarAtualizacao(job),
      error: () => this.parar()
    });
  }

  parar(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
    this.jobIdMonitorado = undefined;
  }

  estaMonitorando(jobId: string): boolean {
    return this.jobIdMonitorado === jobId && !!this.pollingSubscription;
  }

  onJobUpdate(listener: JobUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private processarAtualizacao(job: ImportJobResponse): void {
    this.jobAtual.set(job);
    this.listeners.forEach((listener) => listener(job));

    if (!this.jobFinalizado(job.status) || this.notificacaoEnviada) {
      return;
    }

    this.notificacaoEnviada = true;
    this.notificationService.notificarConsultaFinalizada(job, this.router.url);
    this.parar();
  }

  private jobFinalizado(status: string): boolean {
    return status === 'CONCLUIDO' || status === 'ERRO' || status === 'CANCELADO';
  }
}
