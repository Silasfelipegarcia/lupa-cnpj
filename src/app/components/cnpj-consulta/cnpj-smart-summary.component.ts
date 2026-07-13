import { Component, computed, input } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { buildSmartSummary } from '../../utils/cnpj-insight-engine';

@Component({
  selector: 'app-cnpj-smart-summary',
  standalone: true,
  template: `
    <section class="cc-section" aria-labelledby="cc-smart-summary-title">
      <div class="cc-section-head">
        <h2 id="cc-smart-summary-title" class="cc-section-title">Resumo Inteligente</h2>
      </div>
      <div class="cc-card">
        <p class="cc-summary-text">{{ summary() }}</p>
      </div>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjSmartSummaryComponent {
  readonly data = input.required<CnpjPreviewResult>();
  readonly summary = computed(() => buildSmartSummary(this.data()));
}
