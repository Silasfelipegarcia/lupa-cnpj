import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL } from '../../legal/legal.constants';
import { LegalPageShellComponent } from './legal-page-shell.component';

@Component({
  selector: 'app-termos',
  standalone: true,
  imports: [LegalPageShellComponent, RouterLink],
  template: `
    <app-legal-page-shell
      [title]="'Termos de Uso'"
      [subtitle]="'Condições para utilização do ' + legal.productName + '.'"
      [updated]="legal.policyEffectiveDate"
      [productName]="legal.productName"
    >
      <h2>1. Aceitação</h2>
      <p>
        Ao criar conta ou utilizar o {{ legal.productName }}, você concorda com estes Termos e com a nossa
        <a routerLink="/privacidade">Política de Privacidade</a>.
        Se não concordar, não utilize o serviço.
      </p>

      <h2>2. O serviço</h2>
      <p>
        O {{ legal.productName }} permite consulta e enriquecimento de dados cadastrais de empresas (CNPJ) em lote,
        com exportação e filtros conforme o plano contratado. Os dados provêm de fontes oficiais e são fornecidos
        &quot;no estado em que se encontram&quot;, sem garantia de completude absoluta ou adequação a um fim específico
        além da prospecção B2B descrita no produto.
      </p>

      <h2>3. Conta e elegibilidade</h2>
      <ul>
        <li>Você deve fornecer informações verdadeiras (nome, e-mail, CPF válido).</li>
        <li>É responsável por manter a confidencialidade da senha e pela atividade na sua conta.</li>
        <li>Menores de 18 anos não devem utilizar o serviço sem supervisão legal.</li>
      </ul>

      <h2>4. Planos, limites e pagamentos</h2>
      <p>
        Os limites de uso (consultas, planilhas por dia, linhas por arquivo) dependem do plano ativo (Free, Prospecção, Growth).
        Preços e benefícios estão descritos na página de planos. Pagamentos são processados pelo Mercado Pago;
        renovações automáticas aplicam-se conforme o plano escolhido. Você pode cancelar a renovação conforme indicado em Conta → Plano.
      </p>

      <h2>5. Uso permitido</h2>
      <p>Você concorda em:</p>
      <ul>
        <li>Usar os dados apenas para fins lícitos de prospecção e qualificação comercial;</li>
        <li>Respeitar a LGPD e obter bases legais próprias ao contatar titulares de dados de terceiros;</li>
        <li>Não revender, redistribuir em massa ou fazer engenharia reversa do serviço;</li>
        <li>Não sobrecarregar a plataforma (scraping automatizado, bypass de limites).</li>
      </ul>

      <h2>6. Propriedade e licença</h2>
      <p>
        A plataforma, marca e software pertencem ao operador do {{ legal.productName }}.
        Os dados exportados por você a partir de suas listas podem ser usados conforme sua finalidade comercial,
        respeitando a legislação aplicável.
      </p>

      <h2>7. Suspensão e encerramento</h2>
      <p>
        Podemos suspender ou encerrar contas que violem estes Termos, apresentem risco de segurança ou inadimplência.
        Você pode solicitar exclusão da conta pelo e-mail
        <a [href]="'mailto:' + legal.contactEmail">{{ legal.contactEmail }}</a>.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        Na extensão permitida pela lei, não nos responsabilizamos por lucros cessantes, decisões comerciais tomadas com base
        nos dados, ou indisponibilidades temporárias. Nossa responsabilidade agregada limita-se ao valor pago nos últimos
        12 meses pelo plano, quando aplicável.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Podemos atualizar estes Termos. O uso continuado após publicação da nova versão constitui aceitação.
        Versão {{ legal.policyVersion }}, vigente desde {{ legal.policyEffectiveDate }}.
      </p>

      <h2>10. Lei aplicável e foro</h2>
      <p>
        Aplica-se a legislação brasileira. Fica eleito o foro da comarca do domicílio do consumidor, quando cabível
        pelo Código de Defesa do Consumidor.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas sobre estes Termos:
        <a [href]="'mailto:' + legal.contactEmail">{{ legal.contactEmail }}</a>
      </p>
    </app-legal-page-shell>
  `
})
export class TermosComponent {
  readonly legal = LEGAL;
}
