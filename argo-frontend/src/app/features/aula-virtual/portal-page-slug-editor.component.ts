import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PortalPaginaKey, PortalSiteConfig } from '../../core/constants/portal-site-defaults';
import type { PortalFinstruvialServiciosConfig } from '../../core/constants/finstruvial-servicio-landing.types';
import {
  normalizePortalPageSlug,
  portalPageDefaultRoute,
  portalPageRoute,
  portalPageRouteFromSlug,
  portalPageSlugReserved,
  portalPageSlugSegment,
  portalSlugCollisions,
} from '../../core/utils/portal-page-route.util';

@Component({
  selector: 'argo-portal-page-slug-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-page-slug-editor.component.html',
  styleUrl: './portal-page-slug-editor.component.scss',
})
export class PortalPageSlugEditorComponent implements OnChanges {
  @Input({ required: true }) paginaKey!: PortalPaginaKey;
  @Input({ required: true }) site!: PortalSiteConfig;
  @Input() finstruvialServicios: PortalFinstruvialServiciosConfig | null = null;
  @Input() portalUrl = '';
  @Input() compact = false;

  slugInput = '';
  readonly isHome = () => this.paginaKey === 'home';

  ngOnChanges(): void {
    this.syncFromSite();
  }

  syncFromSite(): void {
    if (!this.site.paginas[this.paginaKey]) return;
    this.slugInput = portalPageSlugSegment(this.paginaKey, this.site.paginas[this.paginaKey].ruta);
  }

  rutaPublica(): string {
    return portalPageRoute(this.site, this.paginaKey);
  }

  rutaDefault(): string {
    return portalPageDefaultRoute(this.paginaKey);
  }

  onSlugBlur(): void {
    if (this.isHome()) return;
    const pg = this.site.paginas[this.paginaKey];
    if (!pg) return;
    const normalized = normalizePortalPageSlug(this.slugInput);
    this.slugInput = normalized || portalPageSlugSegment(this.paginaKey, this.rutaDefault());
    pg.ruta = portalPageRouteFromSlug(this.paginaKey, this.slugInput);
  }

  slugPlaceholder(): string {
    return portalPageSlugSegment(this.paginaKey, this.rutaDefault());
  }

  slugDuplicado(): boolean {
    const seg = normalizePortalPageSlug(this.slugInput);
    if (!seg) return false;
    return portalSlugCollisions(this.site, this.finstruvialServicios).some((c) => c.segment === seg);
  }

  slugReservado(): boolean {
    return portalPageSlugReserved(this.slugInput);
  }

  urlCompleta(): string {
    const base = (this.portalUrl || '').replace(/\/+$/, '');
    const path = this.rutaPublica();
    return base ? `${base}${path}` : path;
  }
}
