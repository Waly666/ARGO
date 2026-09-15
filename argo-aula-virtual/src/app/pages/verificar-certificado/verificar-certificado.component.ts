import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { PortalSeoService } from '../../core/portal-seo.service';

@Component({
  selector: 'av-verificar-certificado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verificar-certificado.component.html',
  styleUrl: './verificar-certificado.component.scss',
})
export class VerificarCertificadoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(AulaApiService);
  private sanitizer = inject(DomSanitizer);
  private seo = inject(PortalSeoService);

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

    const frameUrl = this.api.certificadoVerificacionFrameUrl(codigo, token);
    this.certFrameUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(frameUrl));
    this.loading.set(false);
  }
}
