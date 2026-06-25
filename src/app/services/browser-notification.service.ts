import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ImportJobResponse } from '../models/import-job.model';

@Injectable({ providedIn: 'root' })
export class BrowserNotificationService {

  constructor(private router: Router) {}

  suportado(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  permissaoAtual(): NotificationPermission {
    if (!this.suportado()) {
      return 'denied';
    }
    return Notification.permission;
  }

  devePedirPermissao(): boolean {
    return this.suportado() && Notification.permission === 'default';
  }

  permissaoNegada(): boolean {
    return this.suportado() && Notification.permission === 'denied';
  }

  async solicitarPermissao(): Promise<NotificationPermission> {
    if (!this.suportado()) {
      return 'denied';
    }
    if (Notification.permission !== 'default') {
      return Notification.permission;
    }
    return Notification.requestPermission();
  }

  notificarConsultaFinalizada(job: ImportJobResponse, rotaAtual: string): void {
    if (!this.suportado() || Notification.permission !== 'granted') {
      return;
    }

    if (!this.deveExibirNotificacao(job.jobId, rotaAtual)) {
      return;
    }

    const { title, body } = this.montarMensagem(job);

    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: `lupa-insights-job-${job.jobId}`,
      requireInteraction: job.status === 'ERRO'
    });

    notification.onclick = () => {
      window.focus();
      this.router.navigate(['/consulta', job.jobId]);
      notification.close();
    };
  }

  private deveExibirNotificacao(jobId: string, rotaAtual: string): boolean {
    if (document.hidden) {
      return true;
    }
    return !rotaAtual.includes(`/consulta/${jobId}`);
  }

  private montarMensagem(job: ImportJobResponse): { title: string; body: string } {
    switch (job.status) {
      case 'CONCLUIDO':
        return {
          title: 'Consulta de CNPJs concluída',
          body: `${job.arquivo}: ${job.sucesso} sucesso(s) e ${job.erros} erro(s). Clique para voltar ao app.`
        };
      case 'ERRO':
        return {
          title: 'Erro na consulta de CNPJs',
          body: job.mensagem || 'O processamento falhou. Clique para ver os detalhes.'
        };
      case 'CANCELADO':
        return {
          title: 'Consulta de CNPJs cancelada',
          body: `${job.arquivo}: processamento interrompido após ${job.processados} de ${job.total} linha(s).`
        };
      default:
        return {
          title: 'Consulta de CNPJs atualizada',
          body: job.mensagem || 'O processamento foi finalizado.'
        };
    }
  }
}
