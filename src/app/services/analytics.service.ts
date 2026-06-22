import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type FunnelEvent =
  | 'guest_preview_success'
  | 'register'
  | 'first_import'
  | 'export'
  | 'upgrade'
  | 'trial_start'
  | 'reprocess'
  | 'save_list';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  private readonly url = `${environment.apiUrl}/analytics/event`;

  constructor(private http: HttpClient) {}

  track(event: FunnelEvent, properties?: Record<string, string | number | boolean>): void {
    const payload = {
      event,
      properties: properties ? JSON.stringify(properties) : ''
    };

    this.http.post(this.url, payload, { responseType: 'text' }).subscribe({
      error: () => {}
    });

    if (typeof window !== 'undefined' && (window as unknown as { plausible?: (e: string) => void }).plausible) {
      (window as unknown as { plausible: (e: string) => void }).plausible(event);
    }
  }
}
