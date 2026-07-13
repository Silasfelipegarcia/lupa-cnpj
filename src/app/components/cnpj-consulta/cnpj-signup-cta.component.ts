import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsCtaDirective } from '../../directives/analytics-cta.directive';

@Component({
  selector: 'app-cnpj-signup-cta',
  standalone: true,
  imports: [RouterLink, AnalyticsCtaDirective],
  template: `
    <section class="cc-section" aria-labelledby="cc-signup-title">
      <div class="cc-card cc-signup">
        <h2 id="cc-signup-title" class="cc-signup-title">Desbloqueie gratuitamente a análise completa</h2>
        <p class="cc-signup-sub">Crie sua conta em menos de 20 segundos.</p>
        <a
          [routerLink]="['/cadastro']"
          [queryParams]="signupQueryParams()"
          class="btn btn-primary btn-lg"
          (click)="signupClick.emit()"
        >
          Desbloquear gratuitamente
        </a>
        <ul class="cc-signup-benefits" aria-label="Benefícios da conta">
          @for (benefit of benefits; track benefit) {
            <li class="cc-signup-benefit">
              <span class="cc-signup-benefit-icon" aria-hidden="true">✓</span>
              <span>{{ benefit }}</span>
            </li>
          }
        </ul>
        <p class="cc-signup-login">
          <a routerLink="/login" appAnalyticsCta="entrar" appAnalyticsCtaLocation="insights_signup_login">Já tenho conta</a>
        </p>
      </div>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjSignupCtaComponent {
  readonly signupQueryParams = input<Record<string, string>>({});
  readonly signupClick = output<void>();

  readonly benefits = [
    'Salve empresas favoritas',
    'Histórico das consultas',
    'Compare empresas',
    'Exporte relatórios',
    'Receba novos recursos automaticamente'
  ];
}
