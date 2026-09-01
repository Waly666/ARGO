import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { PortalIconComponent } from '../../shared/portal-icon/portal-icon.component';
import { PortalPromoBannerHeroComponent } from '../../shared/portal-promo-banner-hero/portal-promo-banner-hero.component';
import { PromoBannerRibbonItem } from '../../shared/portal-promo-banner-hero/portal-promo-banner-defaults';
import { AulaApiService } from '../../core/aula-api.service';
import { CertificadoConsultaItem, CertificadoConsultaRes, PortalConfig } from '../../core/models';
import { mergePortalLanding } from '../../core/portal-landing';
import { PortalSeoService } from '../../core/portal-seo.service';
import { PortalThemeService } from '../../core/portal-theme.service';

@Component({
  selector: 'av-consulta-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule, TurnstileComponent, PortalIconComponent, PortalPromoBannerHeroComponent],
  templateUrl: './consulta-certificados.component.html',
  styleUrl: './consulta-certificados.component.scss',
})
export class ConsultaCertificadosComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private portalTheme = inject(PortalThemeService);

  turnstile = viewChild(TurnstileComponent);

  config = signal<PortalConfig | null>(null);
  landing = computed(() => mergePortalLanding(this.config()?.landing));
  consultaHero = computed(() => this.landing().consultaCertificados);
  /** Sin foto en hero solo en Plantilla azul profundo (Finstruvial). */
  consultaHeroShowPhoto = computed(() => !this.portalTheme.finstruvialPortal());

  readonly heroRibbon: PromoBannerRibbonItem[] = [
    { icon: 'academic-cap', label: 'Certificados oficiales' },
    { icon: 'shield-check', label: 'Verificación segura' },
    { icon: 'document', label: 'Consulta en línea' },
    { icon: 'check-badge', label: 'Resultado inmediato' },
  ];

  numDoc = '';
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  loading = signal(false);
  error = signal('');
  consultado = signal(false);
  resultado = signal<CertificadoConsultaRes | null>(null);
  mostrarBotonDescargar = signal(false);
  textoBotonDescargar = signal('Descargar PDF');
  descargandoId = signal<string | null>(null);
  descargaError = signal('');
  descargaToken = signal('');

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => {
        this.config.set(c);
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        const landing = mergePortalLanding(c.landing);
        const cc = landing.consultaCertificados;
        this.mostrarBotonDescargar.set(cc?.mostrarBotonDescargar === true);
        this.textoBotonDescargar.set(cc?.textoBotonDescargar?.trim() || 'Descargar PDF');
        this.seo.applyConsultaCertificados(c);
      },
      error: () => this.seo.applyConsultaCertificados(null),
    });
  }

  consultar() {
    const doc = this.numDoc.trim();
    if (!doc) {
      this.error.set('Ingrese su número de cédula.');
      return;
    }
    const token = this.turnstileToken() || this.turnstile()?.getToken() || '';
    if (this.turnstileSiteKey() && !token) {
      this.error.set('Complete la verificación anti-bot.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.consultado.set(false);
    this.resultado.set(null);
    this.descargaToken.set('');

    this.api.consultarCertificados(doc, token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.consultado.set(true);
        this.resultado.set(res);
        this.descargaToken.set(res.descargaToken || '');
      },
      error: (e) => {
        this.loading.set(false);
        this.turnstile()?.reset();
        this.consultado.set(true);
        this.error.set(e?.error?.message || 'No se pudo consultar. Intente de nuevo.');
      },
    });
  }

  filas(): CertificadoConsultaItem[] {
    return this.resultado()?.items || [];
  }

  descargarCertificado(row: CertificadoConsultaItem) {
    const certId = row._id?.trim();
    if (!certId) return;
    const doc = this.numDoc.trim();
    if (!doc) return;

    const token = this.descargaToken();
    if (this.turnstileSiteKey() && !token) {
      this.descargaError.set('Sesión de descarga expirada. Consulte de nuevo e intente descargar.');
      return;
    }
    this.descargaError.set('');
    this.descargandoId.set(certId);

    this.api.descargarCertificadoConsulta(certId, doc, token || undefined).subscribe({
      next: (blob) => {
        this.descargandoId.set(null);
        const codigo = row.codVerificacion || row.idCertificado || certId;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificado-${codigo}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: async (e) => {
        this.descargandoId.set(null);
        let msg = 'No se pudo descargar el certificado.';
        const body = e?.error;
        if (body instanceof Blob) {
          try {
            const txt = await body.text();
            const parsed = JSON.parse(txt);
            if (parsed?.message) msg = parsed.message;
          } catch {
            /* ignore */
          }
        } else if (body?.message) {
          msg = body.message;
        }
        this.descargaError.set(msg);
      },
    });
  }
}
