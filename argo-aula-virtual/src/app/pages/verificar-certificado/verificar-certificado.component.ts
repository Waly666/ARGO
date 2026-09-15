import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { rewriteCertificadoHtmlForScreen } from '../../core/certificado-mobile-html';
import { PortalSeoService } from '../../core/portal-seo.service';

@Component({
  selector: 'av-verificar-certificado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verificar-certificado.component.html',
  styleUrl: './verificar-certificado.component.scss',
})
export class VerificarCertificadoComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(AulaApiService);
  private sanitizer = inject(DomSanitizer);
  private seo = inject(PortalSeoService);

  private blobUrl: string | null = null;

  loading = signal(true);
  error = signal('');
  codigo = signal('');
  certFrameUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit() {
    const codigo = String(this.route.snapshot.paramMap.get('codigo') || '').trim();
    const token = String(
      this.route.snapshot.queryParamMap.get('t') ||
        this.route.snapshot.queryParamMap.get('linkToken') ||
        '',
    ).trim();

    this.codigo.set(codigo);
    this.seo.applyVerificarCertificado(codigo);

    if (!codigo || !token) {
      this.loading.set(false);
      this.error.set('El enlace de verificación no es válido o está incompleto.');
      return;
    }

    this.api.certificadoVerificacionHtml(codigo, token).subscribe({
      next: (html) => {
        const adapted = rewriteCertificadoHtmlForScreen(html);
        const blob = new Blob([adapted], { type: 'text/html;charset=utf-8' });
        this.revokeBlobUrl();
        this.blobUrl = URL.createObjectURL(blob);
        this.certFrameUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.blobUrl));
        this.loading.set(false);
      },
      error: async (e) => {
        this.loading.set(false);
        let msg = 'No se pudo verificar el certificado.';
        const body = e?.error;
        if (typeof body === 'string' && body.trim()) {
          msg = body.trim();
        } else if (body instanceof Blob) {
          try {
            const txt = await body.text();
            if (txt.trim()) msg = txt.trim();
          } catch {
            /* ignore */
          }
        } else if (body?.message) {
          msg = body.message;
        }
        this.error.set(msg);
      },
    });
  }

  ngOnDestroy() {
    this.revokeBlobUrl();
  }

  private revokeBlobUrl() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
