import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  PortalHeroImagenFields,
  PortalLandingHeroImageKey,
  portalHeroImagenPreviewUrl,
  portalHeroImagenStoredUrl,
  portalLogoCertificacionPreviewUrl,
  portalLogoCertificacionStoredUrl,
} from '../../core/utils/portal-hero-imagen.util';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';
import { PortalEditorImagenPromptComponent } from './portal-editor-imagen-prompt.component';

@Component({
  selector: 'argo-portal-promo-hero-imagen-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, PortalEditorImagenPromptComponent],
  templateUrl: './portal-promo-hero-imagen-editor.component.html',
  styleUrl: './portal-promo-hero-imagen-editor.component.scss',
})
export class PortalPromoHeroImagenEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) pageKey!: PortalLandingHeroImageKey;
  @Input({ required: true }) hero!: PortalHeroImagenFields;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) routePath!: string;
  @Input() emptyHint = 'Sin imagen configurada. El hero mostrará solo texto.';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  heroUploading = signal(false);

  tieneImagenHero(): boolean {
    if (this.pageKey === 'homeLogoCertificacion') {
      return !!portalLogoCertificacionStoredUrl(this.hero);
    }
    return !!portalHeroImagenStoredUrl(this.hero);
  }

  heroPreviewUrl(): string | null {
    if (this.pageKey === 'homeLogoCertificacion') {
      return portalLogoCertificacionPreviewUrl(this.hero, environment.uploadsUrl);
    }
    return portalHeroImagenPreviewUrl(this.hero, environment.uploadsUrl);
  }

  onHeroImagen(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.heroUploading.set(true);
    this.svc
      .subirLandingHeroImagenPortal(this.pageKey, file)
      .pipe(
        finalize(() => {
          this.heroUploading.set(false);
          input.value = '';
        }),
      )
      .subscribe({
        next: (res) => {
          this.syncHeroFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del héroe actualizada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir la imagen',
            error: true,
          });
        },
      });
  }

  quitarImagenHero() {
    this.heroUploading.set(true);
    this.svc
      .quitarLandingHeroImagenPortal(this.pageKey)
      .pipe(finalize(() => this.heroUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.syncHeroFromConfig(res.config);
          this.portalConfigUpdated.emit(res.config);
          this.avNotice.emit({ message: res.message || 'Imagen del héroe eliminada' });
        },
        error: (e) => {
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo quitar la imagen',
            error: true,
          });
        },
      });
  }

  usesFlatHeroAlt(): boolean {
    return (
      this.pageKey === 'blog' ||
      this.pageKey === 'examenTeorico' ||
      this.pageKey === 'consultaCertificados' ||
      this.pageKey === 'homeLogoCertificacion'
    );
  }

  heroAltText(): string {
    if (this.pageKey === 'homeLogoCertificacion') {
      return this.hero.logoCertificacionAlt?.trim() || '';
    }
    return this.usesFlatHeroAlt()
      ? this.hero.heroImagenAlt?.trim() || ''
      : this.hero.imagenAlt?.trim() || '';
  }

  onHeroAltChange(value: string) {
    if (this.pageKey === 'homeLogoCertificacion') this.hero.logoCertificacionAlt = value;
    else if (this.usesFlatHeroAlt()) this.hero.heroImagenAlt = value;
    else this.hero.imagenAlt = value;
  }

  heroPromptText(): string {
    if (this.pageKey === 'homeLogoCertificacion') {
      return this.hero.logoCertificacionPrompt?.trim() || '';
    }
    return this.usesFlatHeroAlt()
      ? this.hero.heroImagenPrompt?.trim() || ''
      : this.hero.promptImagen?.trim() || '';
  }

  onHeroPromptChange(value: string) {
    if (this.pageKey === 'homeLogoCertificacion') this.hero.logoCertificacionPrompt = value;
    else if (this.usesFlatHeroAlt()) this.hero.heroImagenPrompt = value;
    else this.hero.promptImagen = value;
  }

  private syncHeroFromConfig(config: PortalAulaConfig) {
    const landing = config.landing;
    if (!landing) return;
    const src = this.extractHeroSlice(landing);
    if (src) Object.assign(this.hero, src);
  }

  private extractHeroSlice(landing: NonNullable<PortalAulaConfig['landing']>): PortalHeroImagenFields | null {
    switch (this.pageKey) {
      case 'blog':
        return landing.blog ?? null;
      case 'pqr':
        return landing.pqr?.hero ?? null;
      case 'examenTeorico':
        return landing.examenTeorico ?? null;
      case 'jornadasCapacitacion':
        return landing.jornadasCapacitacion?.hero ?? null;
      case 'evaluacionJornadas':
        return landing.evaluacionJornadas?.hero ?? null;
      case 'consultaCertificados':
        return landing.consultaCertificados ?? null;
      case 'homeLogoCertificacion':
        return landing.hero ?? null;
      default:
        return null;
    }
  }
}
