import { Component, computed, input } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { buildInsights } from '../../utils/cnpj-insight-engine';

@Component({
  selector: 'app-cnpj-insights-section',
  standalone: true,
  template: `
    <section class="cc-section" aria-labelledby="cc-insights-title">
      <div class="cc-section-head">
        <h2 id="cc-insights-title" class="cc-section-title">Insights</h2>
        <p class="cc-section-sub">Análises automáticas com base nos dados oficiais.</p>
      </div>
      @if (insights().length > 0) {
        <div class="cc-insights-grid">
          @for (insight of insights(); track insight.text) {
            <article class="cc-insight-card">
              <span class="cc-insight-icon" aria-hidden="true">◆</span>
              <p class="cc-insight-text">{{ insight.text }}</p>
            </article>
          }
        </div>
      }
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjInsightsSectionComponent {
  readonly data = input.required<CnpjPreviewResult>();
  readonly insights = computed(() => buildInsights(this.data()));
}
