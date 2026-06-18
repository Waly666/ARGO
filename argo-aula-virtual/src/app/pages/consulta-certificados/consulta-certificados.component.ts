import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { TurnstileComponent } from '../../components/turnstile/turnstile.component';
import { AulaApiService } from '../../core/aula-api.service';
import { CertificadoConsultaItem, CertificadoConsultaRes } from '../../core/models';
import { PortalSeoService } from '../../core/portal-seo.service';

@Component({
  selector: 'av-consulta-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule, TurnstileComponent],
  templateUrl: './consulta-certificados.component.html',
  styleUrl: './consulta-certificados.component.scss',
})
export class ConsultaCertificadosComponent implements OnInit {
  private api = inject(AulaApiService);
  private seo = inject(PortalSeoService);
  private route = inject(ActivatedRoute);

  turnstile = viewChild(TurnstileComponent);

  numDoc = '';
  turnstileSiteKey = signal('');
  turnstileToken = signal('');
  loading = signal(false);
  error = signal('');
  consultado = signal(false);
  resultado = signal<CertificadoConsultaRes | null>(null);

  ngOnInit() {
    const codQr = this.route.snapshot.queryParamMap.get('cod')?.trim() || '';
    const docQr = this.route.snapshot.queryParamMap.get('doc')?.trim() || '';
    if (docQr) this.numDoc = docQr;

    this.api.config().subscribe({
      next: (c) => {
        this.turnstileSiteKey.set(c.turnstileSiteKey || '');
        this.seo.applyConsultaCertificados(c);
      },
      error: () => this.seo.applyConsultaCertificados(null),
    });

    if (codQr) {
      this.consultarPorCodigo(codQr);
    }
  }

  /** Verificación directa al escanear el QR del certificado (sin turnstile). */
  consultarPorCodigo(cod: string) {
    const c = cod.trim();
    if (!c) return;

    this.loading.set(true);
    this.error.set('');
    this.consultado.set(false);
    this.resultado.set(null);

    this.api.verificarCertificadoCodigo(c).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.consultado.set(true);
        this.resultado.set(res);
        if (res.cedula != null) this.numDoc = String(res.cedula);
      },
      error: (e) => {
        this.loading.set(false);
        this.consultado.set(true);
        this.error.set(e?.error?.message || 'No se pudo verificar el certificado.');
      },
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

    this.api.consultarCertificados(doc, token || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.consultado.set(true);
        this.resultado.set(res);
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
}
