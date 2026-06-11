import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { CursoVirtual, PortalConfig } from './models';

const KEYWORDS_BASE =
  'cursos virtuales, programas de capacitación, aula virtual, cursos en línea, programas certificados, seguridad vial, capacitación online Colombia';

@Injectable({ providedIn: 'root' })
export class PortalSeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);

  applyHome(config: PortalConfig | null, cursos: CursoVirtual[] = []) {
    const nombre = config?.nombreCea?.trim() || 'Aula virtual';
    const pageTitle = `${nombre} — Cursos y programas en aula virtual`;
    const description = this.buildDescription(config, cursos);
    const keywords = this.buildKeywords(cursos);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = origin ? `${origin}/` : '';
    const image = config?.urlLogoAbsoluta?.trim() || (origin ? `${origin}/images/hero-estudiante.png` : '');

    this.title.setTitle(pageTitle);
    this.setMeta('description', description);
    this.setMeta('keywords', keywords);
    this.setMeta('robots', 'index, follow');

    this.setOg('og:title', pageTitle);
    this.setOg('og:description', description);
    this.setOg('og:type', 'website');
    if (url) this.setOg('og:url', url);
    if (image) this.setOg('og:image', image);
    this.setOg('og:locale', 'es_CO');
    this.setOg('og:site_name', nombre);

    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', pageTitle);
    this.setName('twitter:description', description);
    if (image) this.setName('twitter:image', image);

    if (url) this.setCanonical(url);
    this.injectJsonLd(config, cursos, url);
  }

  private buildDescription(config: PortalConfig | null, cursos: CursoVirtual[]): string {
    const nombre = config?.nombreCea?.trim() || 'nuestra institución';
    const custom = config?.heroSubtitulo?.trim();
    const nombresCursos = cursos
      .slice(0, 3)
      .map((c) => c.nombreProg)
      .filter(Boolean);
    const ejemplos =
      nombresCursos.length > 0
        ? ` Explore programas como ${nombresCursos.join(', ')}.`
        : '';
    if (custom && custom.length > 40) {
      return `${custom} Matricúlese en cursos y programas de capacitación virtual de ${nombre}.${ejemplos}`;
    }
    return `Cursos y programas de capacitación virtual en ${nombre}. Estudie en línea, avance a su ritmo y obtenga certificación en seguridad vial y formación técnica.${ejemplos}`;
  }

  private buildKeywords(cursos: CursoVirtual[]): string {
    const dinamicos = cursos
      .slice(0, 8)
      .map((c) => c.nombreProg?.trim())
      .filter(Boolean)
      .join(', ');
    return dinamicos ? `${KEYWORDS_BASE}, ${dinamicos}` : KEYWORDS_BASE;
  }

  private upsertTag(tag: { name?: string; property?: string; content: string }) {
    if (!tag.content) return;
    const key = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
    const selector = `meta[${key}]`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag(tag, selector);
    } else {
      this.meta.addTag(tag);
    }
  }

  private setMeta(name: string, content: string) {
    this.upsertTag({ name, content });
  }

  private setName(name: string, content: string) {
    this.upsertTag({ name, content });
  }

  private setOg(property: string, content: string) {
    this.upsertTag({ property, content });
  }

  private setCanonical(href: string) {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = href;
  }

  private injectJsonLd(config: PortalConfig | null, cursos: CursoVirtual[], url: string) {
    const scriptId = 'argo-portal-jsonld';
    this.doc.getElementById(scriptId)?.remove();

    const nombre = config?.nombreCea?.trim() || 'Aula virtual';
    const graph: Record<string, unknown>[] = [
      {
        '@type': 'EducationalOrganization',
        name: nombre,
        url: url || undefined,
        description:
          'Cursos y programas de capacitación virtual en seguridad vial y formación técnica.',
        address: config?.direccion
          ? {
              '@type': 'PostalAddress',
              streetAddress: config.direccion,
              addressLocality: config.ciudad || undefined,
              addressCountry: 'CO',
            }
          : undefined,
        telephone: config?.telefono || undefined,
        email: config?.email || undefined,
      },
      {
        '@type': 'WebSite',
        name: `${nombre} — Aula virtual`,
        url: url || undefined,
        description: 'Catálogo de cursos y programas de capacitación en línea.',
        potentialAction: {
          '@type': 'SearchAction',
          target: url ? `${url}cursos?q={search_term_string}` : undefined,
          'query-input': 'required name=search_term_string',
        },
      },
    ];

    for (const c of cursos.slice(0, 12)) {
      graph.push({
        '@type': 'Course',
        name: c.nombreProg,
        description: c.descripcionVirtual || c.descripcion || `Programa virtual: ${c.nombreProg}`,
        provider: { '@type': 'EducationalOrganization', name: nombre },
        url: url ? `${url}cursos/${c.idPrograma}` : undefined,
        offers:
          c.tarifaVirtual > 0
            ? {
                '@type': 'Offer',
                price: c.tarifaVirtual,
                priceCurrency: 'COP',
                availability: 'https://schema.org/InStock',
              }
            : undefined,
      });
    }

    const script = this.doc.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
    this.doc.head.appendChild(script);
  }

}
