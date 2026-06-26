import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL } from '../../legal/legal.constants';
import { LegalPageShellComponent } from './legal-page-shell.component';

@Component({
  selector: 'app-privacidade',
  standalone: true,
  imports: [LegalPageShellComponent, RouterLink],
  template: `
    <app-legal-page-shell
      [title]="'Política de Privacidade'"
      [subtitle]="'Como tratamos seus dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).'"
      [updated]="legal.policyEffectiveDate"
      [productName]="legal.productName"
    >
      <h2>1. Quem somos (controlador)</h2>
      <p>
        O {{ legal.productName }} é operado por <strong>{{ legal.controllerName }}</strong>,
        pessoa física, inscrita no CPF sob o nº <strong>{{ legal.controllerCpf }}</strong>,
        responsável pelo tratamento dos dados pessoais descritos nesta política.
      </p>
      <p>
        Contato do titular de dados e privacidade:
        <a [href]="'mailto:' + legal.contactEmail">{{ legal.contactEmail }}</a>
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, CPF e senha (armazenada de forma criptografada).</li>
        <li><strong>Uso do serviço:</strong> importações de planilhas, consultas de CNPJ, histórico de jobs e limites de plano.</li>
        <li><strong>Pagamentos:</strong> dados de cobrança processados pelo Mercado Pago (não armazenamos número completo de cartão).</li>
        <li><strong>Visitantes (sem cadastro):</strong> endereço IP para limite de consulta gratuita e prevenção de abuso.</li>
        <li><strong>Analíticos (com consentimento):</strong> páginas visitadas, eventos de uso e identificador de jornada (flow_id), via Google Analytics.</li>
      </ul>

      <h2>3. Finalidades e bases legais</h2>
      <ul>
        <li><strong>Execução de contrato:</strong> criar conta, autenticar, processar consultas e entregar resultados.</li>
        <li><strong>Legítimo interesse:</strong> segurança, prevenção a fraudes, rate limiting e melhoria técnica do serviço.</li>
        <li><strong>Consentimento:</strong> cookies e tecnologias analíticas (Google Analytics). Você pode recusar sem perder o acesso essencial.</li>
        <li><strong>Obrigação legal:</strong> registros exigidos por legislação fiscal ou judicial, quando aplicável.</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>Podemos compartilhar dados com:</p>
      <ul>
        <li><strong>Mercado Pago</strong> — processamento de pagamentos e assinaturas.</li>
        <li><strong>Google Analytics</strong> — métricas de uso, somente com seu consentimento para cookies analíticos.</li>
        <li><strong>Provedores de infraestrutura</strong> — hospedagem (ex.: Vercel, Railway) sob contratos de tratamento.</li>
      </ul>
      <p>Não vendemos seus dados pessoais.</p>

      <h2>5. Retenção</h2>
      <p>
        Mantemos os dados enquanto sua conta estiver ativa e pelo tempo necessário para cumprir obrigações legais,
        resolver disputas e fazer cumprir nossos termos. Logs de segurança e anti-abuso podem ser retidos por prazo
        limitado conforme necessidade técnica.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>Você pode solicitar, a qualquer momento:</p>
      <ul>
        <li>Confirmação e acesso aos dados;</li>
        <li>Correção de dados incompletos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
        <li>Portabilidade;</li>
        <li>Revogação do consentimento (ex.: cookies analíticos);</li>
        <li>Informação sobre compartilhamentos.</li>
      </ul>
      <p>
        Envie sua solicitação para
        <a [href]="'mailto:' + legal.contactEmail">{{ legal.contactEmail }}</a>.
        Responderemos em prazo razoável conforme a LGPD.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais como HTTPS, autenticação por token, controle de acesso e
        monitoramento de abuso. Nenhum sistema é 100% seguro; em caso de incidente relevante, notificaremos conforme a lei.
      </p>

      <h2>8. Cookies e armazenamento local</h2>
      <p>
        Utilizamos armazenamento no navegador (localStorage e sessionStorage) para sessão, segurança e preferências.
        Cookies analíticos de terceiros só são ativados com seu consentimento. Detalhes em
        <a routerLink="/cookies">Política de Cookies</a>.
      </p>

      <h2>9. Alterações</h2>
      <p>
        Esta política pode ser atualizada. A versão vigente é {{ legal.policyVersion }}, com vigência a partir de
        {{ legal.policyEffectiveDate }}. Alterações relevantes serão comunicadas no site ou por e-mail quando apropriado.
      </p>
    </app-legal-page-shell>
  `
})
export class PrivacidadeComponent {
  readonly legal = LEGAL;
}
