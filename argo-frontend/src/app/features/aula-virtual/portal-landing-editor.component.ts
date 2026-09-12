import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  mergePortalLanding,
  PORTAL_LANDING_DEFAULTS,
  PortalLandingConfig,
} from '../../core/constants/portal-landing-defaults';
import { PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { resolvePortalHeroEstilo } from '../../core/utils/portal-theme-css-base.util';
import { PortalAppMobileEditorComponent } from './portal-app-mobile-editor.component';
import { PortalEditorImagenPromptComponent } from './portal-editor-imagen-prompt.component';
import { PortalFieldLabelComponent } from './portal-field-label.component';
import { PortalPromoHeroFieldsEditorComponent } from './portal-promo-hero-fields-editor.component';
import { PortalPromoHeroImagenEditorComponent } from './portal-promo-hero-imagen-editor.component';
import { PortalSeoLegendComponent } from './portal-seo-legend.component';
import { buildLandingEditorNavTabs, LandingEditorNavTab } from './portal-landing-editor-nav.util';

@Component({
  selector: 'argo-portal-landing-editor',
  standalone: true,
  imports: [
    PortalAppMobileEditorComponent,
    PortalEditorImagenPromptComponent,
    PortalFieldLabelComponent,
    PortalPromoHeroFieldsEditorComponent,
    PortalPromoHeroImagenEditorComponent,
    PortalSeoLegendComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './portal-landing-editor.component.html',
  styleUrl: './portal-landing-editor.component.scss',
})
export class PortalLandingEditorComponent {
  @Input({ required: true }) landing!: PortalLandingConfig;
  @Input() portalForm?: PortalAulaConfig | null;
  @Input() portalUrl = '';
  /** Incrementa al reordenar bloques del inicio (reactividad del orden de pestañas). */
  @Input() homeOrdenRevision = 0;
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  bloque = signal<string | null>('general');

  pestanasNav(): LandingEditorNavTab[] {
    void this.homeOrdenRevision;
    return buildLandingEditorNavTabs(this.portalForm?.site);
  }

  etiquetaPestana(tab: LandingEditorNavTab): string {
    return tab.homePos != null ? `${tab.homePos} · ${tab.label}` : tab.label;
  }

  /** Banner clásico (Finstruvial / azul profundo): H1 animado = heroTitulo del portal. */
  heroEsStarfield(): boolean {
    return resolvePortalHeroEstilo(this.portalForm?.site?.tema) === 'starfield';
  }

  /** Hero dorado con malla (Servial Colombia). */
  heroEsServialMesh(): boolean {
    return resolvePortalHeroEstilo(this.portalForm?.site?.tema) === 'servial-mesh';
  }

  toggleBloque(id: string) {
    this.bloque.update((actual) => (actual === id ? null : id));
  }

  restaurarDefaults() {
    Object.assign(this.landing, mergePortalLanding(PORTAL_LANDING_DEFAULTS));
  }

  addOferta() {
    this.landing.ofertas.items.push({ icon: '💻', title: '', text: '' });
  }

  removeOferta(i: number) {
    this.landing.ofertas.items.splice(i, 1);
  }

  addBeneficio() {
    this.landing.beneficios.items.push({ icon: '✅', title: '', text: '' });
  }

  removeBeneficio(i: number) {
    this.landing.beneficios.items.splice(i, 1);
  }

  addLicencia() {
    this.landing.licencias.items.push({
      icon: '🚗',
      codigo: '',
      titulo: '',
      incluye: [''],
      licenciaLabel: '',
      valor: '',
      btnTexto: 'Solicitar ahora',
      btnUrl: '/registro',
      destacada: false,
    });
  }

  removeLicencia(i: number) {
    this.landing.licencias.items.splice(i, 1);
  }

  addLicenciaIncluye(licIdx: number) {
    this.landing.licencias.items[licIdx]?.incluye.push('');
  }

  removeLicenciaIncluye(licIdx: number, lineIdx: number) {
    this.landing.licencias.items[licIdx]?.incluye.splice(lineIdx, 1);
  }

  addServicio() {
    this.landing.servicios.items.push({ icon: '📋', title: '', url: '' });
  }

  removeServicio(i: number) {
    this.landing.servicios.items.splice(i, 1);
  }

  addValor() {
    this.landing.valores.items.push({ title: '', text: '' });
  }

  removeValor(i: number) {
    this.landing.valores.items.splice(i, 1);
  }

  addTestimonio() {
    this.landing.testimonios.items.push({ nombre: '', rol: '', texto: '' });
  }

  removeTestimonio(i: number) {
    this.landing.testimonios.items.splice(i, 1);
  }

  addPaso() {
    const n = String(this.landing.pasos.items.length + 1);
    this.landing.pasos.items.push({ paso: n, title: '', text: '' });
  }

  removePaso(i: number) {
    this.landing.pasos.items.splice(i, 1);
  }

  addAppMobileFeature() {
    this.landing.appMobile.features.push({ icon: '📱', title: '', text: '' });
  }

  removeAppMobileFeature(i: number) {
    this.landing.appMobile.features.splice(i, 1);
  }

  addFaq() {
    this.landing.faq.items.push({ pregunta: '', respuesta: '' });
  }

  removeFaq(i: number) {
    this.landing.faq.items.splice(i, 1);
  }

  addCarrera() {
    this.landing.carreras.items.push({
      titulo: '',
      cno: '',
      horas: 1020,
      semestres: 3,
      jornadas: 'Diurna, nocturna, sábados',
    });
  }

  removeCarrera(i: number) {
    this.landing.carreras.items.splice(i, 1);
  }

  addPilar(tipo: 'capacitacion' | 'campanas') {
    this.landing.pilares[tipo].push('');
  }

  removePilar(tipo: 'capacitacion' | 'campanas', i: number) {
    this.landing.pilares[tipo].splice(i, 1);
  }

  addFooterServicio() {
    this.landing.footerServicios.push('');
  }

  removeFooterServicio(i: number) {
    this.landing.footerServicios.splice(i, 1);
  }
}
