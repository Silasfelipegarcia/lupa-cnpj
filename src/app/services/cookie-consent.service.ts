import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VERSION } from '../legal/legal.constants';

export interface CookieConsentState {
  version: typeof COOKIE_CONSENT_VERSION;
  essential: true;
  analytics: boolean;
  decidedAt: string;
}

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  private readonly subject = new BehaviorSubject<CookieConsentState | null>(this.load());

  readonly consent$: Observable<CookieConsentState | null> = this.subject.asObservable();

  hasDecided(): boolean {
    return this.subject.value !== null;
  }

  hasAnalyticsConsent(): boolean {
    return this.subject.value?.analytics === true;
  }

  getState(): CookieConsentState | null {
    return this.subject.value;
  }

  acceptAll(): void {
    this.persist({ essential: true, analytics: true });
  }

  rejectOptional(): void {
    this.persist({ essential: true, analytics: false });
  }

  savePreferences(analytics: boolean): void {
    this.persist({ essential: true, analytics });
  }

  private persist(partial: Pick<CookieConsentState, 'essential' | 'analytics'>): void {
    const state: CookieConsentState = {
      version: COOKIE_CONSENT_VERSION,
      essential: true,
      analytics: partial.analytics,
      decidedAt: new Date().toISOString()
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));
    }
    this.subject.next(state);
  }

  private load(): CookieConsentState | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as CookieConsentState;
      if (parsed.version !== COOKIE_CONSENT_VERSION) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
