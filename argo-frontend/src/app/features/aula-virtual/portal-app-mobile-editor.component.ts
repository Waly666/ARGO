import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PortalLandingConfig } from '../../core/constants/portal-landing-defaults';
import { AulaVirtualAdminService, PortalAulaConfig } from '../../core/services/aula-virtual-admin.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-portal-app-mobile-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './portal-app-mobile-editor.component.html',
  styleUrl: './portal-app-mobile-editor.component.scss',
})
export class PortalAppMobileEditorComponent {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) appMobile!: PortalLandingConfig['appMobile'];
  @Input() portalUrl = '';
  @Output() portalConfigUpdated = new EventEmitter<PortalAulaConfig>();
  @Output() avNotice = new EventEmitter<{ message: string; error?: boolean }>();

  apkUploading = signal(false);

  apkDownloadHref(): string | null {
    const rel = this.appMobile.apkUrl?.trim();
    if (!rel) return null;
    if (/^https?:\/\//i.test(rel)) return rel;
    const base = this.portalUrl?.replace(/\/+$/, '') || environment.apiUrl.replace(/\/api\/?$/, '');
    return `${base}${rel.startsWith('/') ? rel : `/${rel}`}`;
  }

  onApkSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.apkUploading.set(true);
    this.svc
      .subirApkPortal(file, this.appMobile.apkNombre?.trim() || file.name)
      .pipe(finalize(() => this.apkUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.portalConfigUpdated.emit(res.config);
          if (res.config.landing?.appMobile) {
            Object.assign(this.appMobile, res.config.landing.appMobile);
          } else {
            this.appMobile.apkUrl = res.apkUrl;
            this.appMobile.apkNombre = res.apkNombre;
          }
          this.avNotice.emit({
            message:
              res.message ||
              'APK publicada. Pulse «Publicar cambios en el sitio» si también editó textos.',
          });
        },
        error: (e) =>
          this.avNotice.emit({
            message: e?.error?.message || 'No se pudo subir el APK',
            error: true,
          }),
      });
  }

  addFeature() {
    this.appMobile.features.push({ icon: '📱', title: '', text: '' });
  }

  removeFeature(i: number) {
    this.appMobile.features.splice(i, 1);
  }
}
