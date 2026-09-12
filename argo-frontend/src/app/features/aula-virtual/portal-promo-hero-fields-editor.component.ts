import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  PortalPromoHeroPillar,
  PortalPromoHeroRibbonItem,
  PortalPromoHeroTheme,
} from '../../core/constants/portal-promo-hero-fields.util';
import {
  addStringItem,
  removeAt,
} from './portal-landing-editor-helpers';
import { PortalIconografiaConfig } from '../../core/constants/portal-icon-catalog.types';
import { PortalFieldLabelComponent } from './portal-field-label.component';
import { PortalIconPickerComponent } from './portal-icon-picker.component';

export interface PortalPromoHeroEditorModel {
  kicker?: string;
  tituloLinea?: string;
  tituloAcento?: string;
  lead?: string;
  pillarsLabel?: string;
  pillars?: PortalPromoHeroPillar[];
  highlightIcon?: string;
  highlightTitle?: string;
  highlightSubtitle?: string;
  ribbonLabel?: string;
  ribbon?: PortalPromoHeroRibbonItem[];
  mostrarBadgeVirtual?: boolean;
  virtualBadgeLabel?: string;
  backLabel?: string;
  theme?: PortalPromoHeroTheme;
  stats?: string[];
  ctaPrincipal?: string;
  ctaPrincipalUrl?: string;
  ctaSecundario?: string;
  ctaSecundarioUrl?: string;
}

@Component({
  selector: 'argo-portal-promo-hero-fields-editor',
  standalone: true,
  imports: [
    PortalFieldLabelComponent,
    PortalIconPickerComponent,
    CommonModule,
    FormsModule,
  ],
  templateUrl: './portal-promo-hero-fields-editor.component.html',
  styleUrl: './portal-promo-hero-fields-editor.component.scss',
})
export class PortalPromoHeroFieldsEditorComponent {
  @Input({ required: true }) hero!: PortalPromoHeroEditorModel;
  @Input() iconografia: Partial<PortalIconografiaConfig> | null = null;
  @Input() showTitle = true;
  @Input() showLead = true;
  @Input() showPillars = false;
  @Input() showPillarsLabel = true;
  @Input() showHighlight = false;
  @Input() highlightSubtitleRows = 1;
  @Input() showVirtualBadge = false;
  @Input() showBackLabel = false;
  @Input() showTheme = false;
  @Input() showStats = false;
  @Input() showRibbon = false;
  @Input() showCtas = false;
  @Input() tituloAcentoHint = 'Opcional. Si lo deja vacío, puede usarse el nombre de la empresa en el portal.';

  readonly themes: PortalPromoHeroTheme[] = ['gold', 'green', 'violet', 'blue'];

  addPillar() {
    if (!this.hero.pillars) this.hero.pillars = [];
    this.hero.pillars.push({ icon: 'shield-check', label: '' });
  }

  removePillar(index: number) {
    if (!this.hero.pillars) return;
    removeAt(this.hero.pillars, index);
  }

  addStat() {
    if (!this.hero.stats) this.hero.stats = [];
    addStringItem(this.hero.stats);
  }

  removeStat(index: number) {
    if (!this.hero.stats) return;
    removeAt(this.hero.stats, index);
  }

  addRibbonItem() {
    if (!this.hero.ribbon) this.hero.ribbon = [];
    this.hero.ribbon.push({ icon: 'document', label: '' });
  }

  removeRibbonItem(index: number) {
    if (!this.hero.ribbon) return;
    removeAt(this.hero.ribbon, index);
  }
}
