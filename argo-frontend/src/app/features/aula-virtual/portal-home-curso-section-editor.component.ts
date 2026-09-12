import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PortalExamenTeoricoLanding } from '../../core/constants/examen-teorico-landing-defaults';
import { PortalMercanciasPeligrosasLanding } from '../../core/constants/mercancias-peligrosas-landing-defaults';
import { PortalManejoDefensivoLanding } from '../../core/constants/manejo-defensivo-landing-defaults';
import { PortalPrimerosAuxiliosLanding } from '../../core/constants/primeros-auxilios-landing-defaults';
import { PortalTrabajoEnAlturasLanding } from '../../core/constants/trabajo-en-alturas-landing-defaults';
import { PortalPaginaKey, PortalSiteConfig } from '../../core/constants/portal-site-defaults';
import { homeCursoCtaUrl, portalPageRoute } from '../../core/utils/portal-page-route.util';
import { PORTAL_EDITOR_ACENTOS, removeAt } from './portal-landing-editor-helpers';
import { PortalIconografiaConfig } from '../../core/constants/portal-icon-catalog.types';
import { PortalFieldLabelComponent } from './portal-field-label.component';
import { PortalIconPickerComponent } from './portal-icon-picker.component';

type HomeItemLike = {
  numero: number;
  icon: string;
  acento: string;
  titulo: string;
  texto: string;
};

@Component({
  selector: 'argo-portal-home-curso-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalFieldLabelComponent, PortalIconPickerComponent],
  templateUrl: './portal-home-curso-section-editor.component.html',
  styleUrl: './portal-home-curso-section-editor.component.scss',
})
export class PortalHomeCursoSectionEditorComponent {
  @Input({ required: true }) paginaKey!: PortalPaginaKey;
  @Input() iconografia: PortalIconografiaConfig | null = null;
  @Input() site?: PortalSiteConfig | null;
  @Input() examenTeorico?: PortalExamenTeoricoLanding;
  @Input() mercanciasPeligrosas?: PortalMercanciasPeligrosasLanding;
  @Input() trabajoEnAlturas?: PortalTrabajoEnAlturasLanding;
  @Input() manejoDefensivo?: PortalManejoDefensivoLanding;
  @Input() primerosAuxilios?: PortalPrimerosAuxiliosLanding;

  readonly acentos = PORTAL_EDITOR_ACENTOS;

  rutaSugerida(): string {
    return portalPageRoute(this.site, this.paginaKey);
  }

  urlBotonPublica(): string {
    return homeCursoCtaUrl(this.site, this.paginaKey, this.ctaUrlActual());
  }

  addHomeItem(): void {
    const items = this.homeItems();
    if (!items) return;
    const n = items.length + 1;
    items.push({
      numero: n,
      icon: 'shield-check',
      acento: 'blue',
      titulo: '',
      texto: '',
    });
  }

  removeHomeItem(index: number): void {
    const items = this.homeItems();
    if (!items) return;
    removeAt(items, index);
  }

  usarSlugAutomatico(): void {
    const model = this.modeloConCtaUrl();
    if (!model) return;
    model.ctaUrl = '';
  }

  homeItems(): HomeItemLike[] | null {
    const m = this.modeloCurso();
    if (!m || !('homeItems' in m) || !Array.isArray(m.homeItems)) return null;
    return m.homeItems as HomeItemLike[];
  }

  private modeloConCtaUrl():
    | PortalExamenTeoricoLanding
    | PortalMercanciasPeligrosasLanding
    | PortalTrabajoEnAlturasLanding
    | PortalManejoDefensivoLanding
    | PortalPrimerosAuxiliosLanding
    | null {
    if (this.paginaKey === 'examenTeorico') return this.examenTeorico ?? null;
    return this.modeloCurso();
  }

  private modeloCurso():
    | PortalMercanciasPeligrosasLanding
    | PortalTrabajoEnAlturasLanding
    | PortalManejoDefensivoLanding
    | PortalPrimerosAuxiliosLanding
    | null {
    switch (this.paginaKey) {
      case 'mercanciasPeligrosas':
        return this.mercanciasPeligrosas ?? null;
      case 'trabajoEnAlturas':
        return this.trabajoEnAlturas ?? null;
      case 'manejoDefensivo':
        return this.manejoDefensivo ?? null;
      case 'primerosAuxilios':
        return this.primerosAuxilios ?? null;
      default:
        return null;
    }
  }

  private ctaUrlActual(): string | undefined {
    const m = this.modeloConCtaUrl();
    return m && 'ctaUrl' in m ? String(m.ctaUrl ?? '') : undefined;
  }
}
