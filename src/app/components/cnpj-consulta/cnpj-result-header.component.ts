import { Component, input } from '@angular/core';
import { CnpjPreviewResult } from '../../models/cnpj-preview.model';
import { CNPJ_FRIENDLY_LABELS } from '../../utils/cnpj-friendly-labels';
import { formatarDataAberturaExibicao } from '../../utils/cnpj-insight-engine';

interface StatCard {
  label: string;
  value: string;
  highlight?: boolean;
}

@Component({
  selector: 'app-cnpj-result-header',
  standalone: true,
  template: `
    <section class="cc-section" aria-label="Resumo da empresa">
      <div class="cc-grid-header">
        @for (card of cards(); track card.label) {
          <div class="cc-stat-card">
            <span class="cc-stat-label">{{ card.label }}</span>
            <span class="cc-stat-value" [class.cc-stat-value--highlight]="card.highlight">{{ card.value }}</span>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjResultHeaderComponent {
  readonly data = input.required<CnpjPreviewResult>();

  cards(): StatCard[] {
    const r = this.data();
    return [
      { label: 'Nome', value: r.razaoSocial || r.nomeFantasia || '—' },
      { label: CNPJ_FRIENDLY_LABELS.cnpj, value: r.cnpj || '—' },
      { label: CNPJ_FRIENDLY_LABELS.situacaoCadastral, value: r.situacaoCadastral || '—', highlight: !!r.situacaoCadastral?.toLowerCase().includes('ativa') },
      { label: CNPJ_FRIENDLY_LABELS.dataAbertura, value: formatarDataAberturaExibicao(r.dataAbertura) },
      { label: CNPJ_FRIENDLY_LABELS.capitalSocial, value: r.capitalSocial || '—' },
      { label: CNPJ_FRIENDLY_LABELS.porte, value: r.porte || '—' },
      { label: CNPJ_FRIENDLY_LABELS.cidade, value: r.cidade || '—' },
      { label: CNPJ_FRIENDLY_LABELS.uf, value: r.uf || '—' }
    ];
  }
}
