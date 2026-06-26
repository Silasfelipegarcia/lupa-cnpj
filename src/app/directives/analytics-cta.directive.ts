import { Directive, HostListener, Input, inject } from '@angular/core';
import { AnalyticsService } from '../services/analytics.service';

/**
 * Rastreia cliques em CTAs sem acoplar lógica nos componentes.
 * Uso: appAnalyticsCta="criar_conta" appAnalyticsCtaLocation="hero"
 */
@Directive({
  selector: '[appAnalyticsCta]',
  standalone: true
})
export class AnalyticsCtaDirective {
  private readonly analytics = inject(AnalyticsService);

  @Input({ required: true }) appAnalyticsCta!: string;
  @Input({ required: true }) appAnalyticsCtaLocation!: string;

  @HostListener('click')
  onClick(): void {
    this.analytics.trackCtaClick(this.appAnalyticsCta, this.appAnalyticsCtaLocation);
  }
}
