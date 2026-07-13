import { Component, computed, input } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { buildFindings } from '../../utils/cnpj-insight-engine';

@Component({
  selector: 'app-cnpj-findings',
  standalone: true,
  template: `
    <section class="cc-section" aria-labelledby="cc-findings-title">
      <div class="cc-section-head">
        <h2 id="cc-findings-title" class="cc-section-title">O que encontramos</h2>
        <p class="cc-section-sub">Informações oficiais reunidas nesta consulta.</p>
      </div>
      <ul class="cc-findings">
        @for (item of findings(); track item.text) {
          <li class="cc-finding-item">
            <span class="cc-finding-icon" aria-hidden="true">✓</span>
            <span>{{ item.text }}</span>
          </li>
        }
      </ul>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjFindingsComponent {
  readonly data = input.required<CnpjPreviewResult>();
  readonly findings = computed(() => buildFindings(this.data()));
}
