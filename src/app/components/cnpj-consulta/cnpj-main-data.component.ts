import { Component, computed, input } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { buildCnpjResultGroups } from '../../utils/cnpj-result-fields';

@Component({
  selector: 'app-cnpj-main-data',
  standalone: true,
  template: `
    <section class="cc-section" aria-labelledby="cc-main-data-title">
      <div class="cc-section-head">
        <h2 id="cc-main-data-title" class="cc-section-title">Dados principais</h2>
        <p class="cc-section-sub">Informações cadastrais organizadas por categoria.</p>
      </div>
      <div class="cc-data-groups">
        @for (grupo of groups(); track grupo.titulo) {
          <article class="cc-card">
            <h3 class="cc-data-group-title">{{ grupo.titulo }}</h3>
            <div class="cc-data-fields">
              @for (campo of grupo.campos; track campo.label) {
                <div class="cc-data-field">
                  <span class="cc-data-label">{{ campo.label }}</span>
                  <span class="cc-data-value">{{ campo.valor }}</span>
                </div>
              }
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjMainDataComponent {
  readonly data = input.required<CnpjPreviewResult>();
  readonly groups = computed(() => buildCnpjResultGroups(this.data()));
}
