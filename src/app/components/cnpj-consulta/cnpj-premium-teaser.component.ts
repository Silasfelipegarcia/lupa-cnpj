import { Component, output } from '@angular/core';

interface PremiumFeature {
  title: string;
}

@Component({
  selector: 'app-cnpj-premium-teaser',
  standalone: true,
  template: `
    <section class="cc-section" aria-labelledby="cc-premium-title">
      <div class="cc-section-head">
        <h2 id="cc-premium-title" class="cc-section-title">Descubra ainda mais sobre esta empresa</h2>
        <p class="cc-section-sub">Recursos exclusivos para quem cria uma conta gratuita.</p>
      </div>
      <div class="cc-premium-grid">
        @for (feature of features; track feature.title) {
          <button type="button" class="cc-premium-card" (click)="unlockClick.emit()" [attr.aria-label]="feature.title + ' — recurso premium'">
            <div class="cc-premium-card__content">
              <p class="cc-premium-card__title">{{ feature.title }}</p>
            </div>
            <div class="cc-premium-card__overlay">
              <span class="cc-premium-lock" aria-hidden="true">🔒</span>
            </div>
          </button>
        }
      </div>
    </section>
  `,
  styleUrl: './_cnpj-consulta.scss'
})
export class CnpjPremiumTeaserComponent {
  readonly unlockClick = output<void>();

  readonly features: PremiumFeature[] = [
    { title: 'Linha do tempo da empresa' },
    { title: 'Histórico de alterações cadastrais' },
    { title: 'Monitoramento de mudanças' },
    { title: 'Favoritar empresa' },
    { title: 'Comparação entre empresas' },
    { title: 'Exportar PDF' },
    { title: 'Exportar Excel' },
    { title: 'Compartilhar relatório' },
    { title: 'Histórico de consultas' },
    { title: 'Resumo completo por IA' }
  ];
}
