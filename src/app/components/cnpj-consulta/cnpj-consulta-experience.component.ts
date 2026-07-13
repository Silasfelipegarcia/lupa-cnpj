import { Component, input, output } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { CnpjResultHeaderComponent } from './cnpj-result-header.component';
import { CnpjSmartSummaryComponent } from './cnpj-smart-summary.component';
import { CnpjFindingsComponent } from './cnpj-findings.component';
import { CnpjMainDataComponent } from './cnpj-main-data.component';
import { CnpjInsightsSectionComponent } from './cnpj-insights-section.component';
import { CnpjPremiumTeaserComponent } from './cnpj-premium-teaser.component';
import { CnpjSignupCtaComponent } from './cnpj-signup-cta.component';

@Component({
  selector: 'app-cnpj-consulta-experience',
  standalone: true,
  imports: [
    CnpjResultHeaderComponent,
    CnpjSmartSummaryComponent,
    CnpjFindingsComponent,
    CnpjMainDataComponent,
    CnpjInsightsSectionComponent,
    CnpjPremiumTeaserComponent,
    CnpjSignupCtaComponent
  ],
  template: `
    <div class="cc-experience">
      <article class="cc-experience-article" [attr.aria-label]="'Resultado da consulta: ' + data().razaoSocial">
        <app-cnpj-result-header [data]="data()" />
        <app-cnpj-smart-summary [data]="data()" />
        <app-cnpj-findings [data]="data()" />
        <app-cnpj-main-data [data]="data()" />
        <app-cnpj-insights-section [data]="data()" />
        <app-cnpj-premium-teaser (unlockClick)="onPremiumUnlock()" />
        <app-cnpj-signup-cta
          [signupQueryParams]="signupQueryParams()"
          (signupClick)="onSignupCta()"
        />
      </article>
    </div>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjConsultaExperienceComponent {
  readonly data = input.required<CnpjPreviewResult>();
  readonly signupQueryParams = input<Record<string, string>>({});
  readonly signupClick = output<string>();

  onPremiumUnlock(): void {
    this.signupClick.emit('result_premium_cta');
  }

  onSignupCta(): void {
    this.signupClick.emit('insights_signup');
  }
}
