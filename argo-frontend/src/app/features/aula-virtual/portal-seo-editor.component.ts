import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  mergePortalSeoPages,
  PORTAL_SEO_PAGE_CATALOG,
  PortalSeoPageKey,
  seoPageForEditor,
  seoPreviewText,
} from '../../core/constants/portal-seo-pages';
import { PortalSiteConfig } from '../../core/constants/portal-site-defaults';
import { PortalLandingConfig } from '../../core/constants/portal-landing-defaults';

const PAGE_ICONS: Record<PortalSeoPageKey, string> = {
  home: '🏠',
  cursos: '📚',
  tienda: '🛒',
  acerca: 'ℹ️',
  fundacion: '🏛️',
  consultaCertificados: '📜',
  cursosConduccion: '🚗',
  examenTeorico: '📋',
  mercanciasPeligrosas: '☣️',
  trabajoEnAlturas: '🪜',
  blog: '📰',
  galeria: '📷',
  pqr: '📝',
  jornadasCapacitacion: '⛺',
  evaluacionJornadas: '⭐',
};

const GRUPO_ICONS: Record<string, string> = {
  Principal: '✨',
  Institucional: '🏢',
  Servicios: '🎓',
  Contenido: '📄',
};

type CharState = 'empty' | 'ok' | 'warn' | 'over';

@Component({
  selector: 'argo-portal-seo-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-seo-editor.component.html',
  styleUrl: './portal-seo-editor.component.scss',
})
export class PortalSeoEditorComponent implements OnChanges {
  @Input({ required: true }) site!: PortalSiteConfig;
  @Input() landing: PortalLandingConfig | null = null;
  @Input() portalUrl = '';

  readonly catalog = PORTAL_SEO_PAGE_CATALOG;
  selectedKey = signal<PortalSeoPageKey>('home');
  searchQuery = signal('');

  ngOnChanges(): void {
    if (!this.site.seo) {
      this.site.seo = mergePortalSeoPages();
    }
    this.hydrateHomeFromLanding();
  }

  private hydrateHomeFromLanding() {
    if (!this.landing) return;
    const home = this.pageData('home');
    if (home.titulo || home.descripcion || home.keywords) return;
    if (this.landing.metaDescription?.trim()) home.descripcion = this.landing.metaDescription.trim();
    if (this.landing.metaKeywords?.trim()) home.keywords = this.landing.metaKeywords.trim();
  }

  grupos(): string[] {
    return [...new Set(this.filteredCatalog().map((p) => p.grupo))];
  }

  filteredCatalog() {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.catalog;
    return this.catalog.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.ruta.toLowerCase().includes(q) ||
        p.grupo.toLowerCase().includes(q) ||
        p.hint.toLowerCase().includes(q),
    );
  }

  paginasGrupo(grupo: string) {
    return this.filteredCatalog().filter((p) => p.grupo === grupo);
  }

  grupoIcon(grupo: string): string {
    return GRUPO_ICONS[grupo] || '•';
  }

  pageIcon(key: PortalSeoPageKey): string {
    return PAGE_ICONS[key] || '🌐';
  }

  selectPage(key: PortalSeoPageKey) {
    this.selectedKey.set(key);
  }

  pageMeta(key: PortalSeoPageKey) {
    return this.catalog.find((p) => p.key === key)!;
  }

  pageData(key: PortalSeoPageKey) {
    if (!this.site.seo) this.site.seo = mergePortalSeoPages();
    if (!this.site.seo[key]) {
      this.site.seo[key] = { titulo: '', descripcion: '', keywords: '' };
    }
    return this.site.seo[key]!;
  }

  effective(key: PortalSeoPageKey) {
    return seoPageForEditor(this.site, key, this.landing);
  }

  previewTitle(key: PortalSeoPageKey): string {
    const meta = this.pageMeta(key);
    const eff = this.effective(key);
    return seoPreviewText(eff.titulo, meta.defaultTitulo, 62);
  }

  previewDescription(key: PortalSeoPageKey): string {
    const meta = this.pageMeta(key);
    const eff = this.effective(key);
    return seoPreviewText(eff.descripcion, meta.defaultDescripcion, 160);
  }

  previewUrl(key: PortalSeoPageKey): string {
    const base = (this.portalUrl || 'https://ejemplo.edu.co').replace(/\/+$/, '');
    const path = this.pageMeta(key).ruta;
    return `${base}${path}`;
  }

  previewDomain(key: PortalSeoPageKey): string {
    try {
      return new URL(this.previewUrl(key)).hostname;
    } catch {
      return 'su-dominio.edu.co';
    }
  }

  previewPath(key: PortalSeoPageKey): string {
    return this.pageMeta(key).ruta;
  }

  usesAutoText(key: PortalSeoPageKey): boolean {
    const data = this.effective(key);
    const stored = this.pageData(key);
    return !stored.titulo?.trim() && !stored.descripcion?.trim() && !stored.keywords?.trim();
  }

  configuredCount(): number {
    return this.catalog.filter((p) => !this.usesAutoText(p.key)).length;
  }

  charCount(text: string, max: number): string {
    const n = (text || '').length;
    return `${n}/${max}`;
  }

  charState(text: string, recommended: number, max: number): CharState {
    const n = (text || '').length;
    if (n === 0) return 'empty';
    if (n > max) return 'over';
    if (n > recommended) return 'warn';
    return 'ok';
  }

  progressWidth(text: string, max: number): number {
    return Math.min(100, ((text || '').length / max) * 100);
  }

  isOverLimit(text: string, max: number): boolean {
    return (text || '').length > max;
  }

  clearPage(key: PortalSeoPageKey) {
    const data = this.pageData(key);
    data.titulo = '';
    data.descripcion = '';
    data.keywords = '';
    if (key === 'home' && this.landing) {
      this.landing.metaDescription = '';
      this.landing.metaKeywords = '';
    }
  }

  onHomeFieldChange() {
    if (!this.landing) return;
    const home = this.pageData('home');
    this.landing.metaDescription = home.descripcion;
    this.landing.metaKeywords = home.keywords;
  }
}
