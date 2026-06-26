import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { environment } from '../../environments/environment';
import { RouteSeoConfig } from '../models/seo.model';
import { DEFAULT_SEO } from '../seo/seo-defaults';

@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly siteUrl = environment.siteUrl.replace(/\/$/, '');
  private jsonLdScriptId = 'lupa-seo-jsonld';

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const config = this.resolveSeo(snapshot);
    const canonicalUrl = this.canonicalFromUrl(snapshot.url);
    const imageUrl = `${this.siteUrl}/og-image.png`;
    const indexable = config.index !== false;

    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: indexable ? 'index,follow' : 'noindex,nofollow' });

    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:locale', content: 'pt_BR' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Lupa Insights' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    this.setCanonical(canonicalUrl);
    this.setJsonLd(config.jsonLd);
  }

  private resolveSeo(snapshot: RouterStateSnapshot): RouteSeoConfig {
    let route = snapshot.root;
    let seo: RouteSeoConfig | undefined;

    while (route) {
      if (route.data['seo']) {
        seo = route.data['seo'] as RouteSeoConfig;
      }
      route = route.firstChild!;
    }

    return seo ? { ...DEFAULT_SEO, ...seo } : { ...DEFAULT_SEO, index: false };
  }

  private canonicalFromUrl(url: string): string {
    const path = url.split('?')[0].split('#')[0];
    if (path === '/' || path === '') {
      return `${this.siteUrl}/`;
    }
    return `${this.siteUrl}${path.endsWith('/') ? path.slice(0, -1) : path}`;
  }

  private setCanonical(href: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setJsonLd(data?: Record<string, unknown> | Record<string, unknown>[]): void {
    const existing = this.document.getElementById(this.jsonLdScriptId);
    if (existing) {
      existing.remove();
    }
    if (!data) {
      return;
    }
    const script = this.document.createElement('script');
    script.id = this.jsonLdScriptId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }
}
