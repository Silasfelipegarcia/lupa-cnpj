import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL } from '../../legal/legal.constants';
import { LegalPageShellComponent } from './legal-page-shell.component';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [LegalPageShellComponent, RouterLink],
  template: `
    <app-legal-page-shell
      [title]="'Política de Cookies'"
      [subtitle]="'Entenda como usamos cookies e tecnologias similares no ' + legal.productName + '.'"
      [updated]="legal.policyEffectiveDate"
      [productName]="legal.productName"
    >
      <h2>1. O que são cookies e armazenamento local?</h2>
      <p>
        Cookies são pequenos arquivos no navegador. Também usamos <strong>localStorage</strong> e
        <strong>sessionStorage</strong>, que funcionam de forma parecida para guardar preferências e estado da sessão.
      </p>

      <h2>2. Categorias que utilizamos</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Finalidade</th>
            <th>Consentimento</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Essenciais</strong></td>
            <td>
              Token de autenticação (JWT), identificação da API, pedido de checkout em andamento,
              segurança e prevenção de abuso (IP no servidor).
            </td>
            <td>Não necessário — indispensáveis ao serviço</td>
            <td>Sessão ou até logout / conclusão do pagamento</td>
          </tr>
          <tr>
            <td><strong>Preferências</strong></td>
            <td>Lembrar que você viu o tour de onboarding no painel.</td>
            <td>Implícito no uso (não usados para rastreamento entre sites)</td>
            <td>Persistente no navegador</td>
          </tr>
          <tr>
            <td><strong>Analíticos</strong></td>
            <td>
              Google Analytics (GA4), eventos de funil, identificador de jornada (flow_id) e métricas de páginas visitadas.
            </td>
            <td><strong>Requer seu consentimento</strong></td>
            <td>Conforme política do Google (até 24 meses, configurável no GA)</td>
          </tr>
          <tr>
            <td><strong>Terceiros (pagamento)</strong></td>
            <td>Mercado Pago durante checkout e assinatura.</td>
            <td>Necessário para contratar plano pago</td>
            <td>Conforme Mercado Pago</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Como gerenciar suas escolhas</h2>
      <p>
        Ao visitar o site, exibimos um banner para <strong>aceitar</strong> ou <strong>recusar</strong> cookies analíticos.
        Você pode alterar sua escolha a qualquer momento limpando o armazenamento do site no navegador e recarregando a página,
        ou entrando em contato em
        <a [href]="'mailto:' + legal.contactEmail">{{ legal.contactEmail }}</a>.
      </p>
      <p>
        Recusar analíticos <strong>não impede</strong> login, consultas ou pagamentos — apenas desativa métricas como Google Analytics.
      </p>

      <h2>4. Google Analytics</h2>
      <p>
        Quando você consente, carregamos o Google Analytics (ID de medição configurado em produção).
        O IP pode ser anonimizado. Consulte a
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">política do Google</a>.
      </p>

      <h2>5. Mais informações</h2>
      <p>
        Detalhes sobre dados pessoais estão na
        <a routerLink="/privacidade">Política de Privacidade</a>.
      </p>
    </app-legal-page-shell>
  `
})
export class CookiesComponent {
  readonly legal = LEGAL;
}
