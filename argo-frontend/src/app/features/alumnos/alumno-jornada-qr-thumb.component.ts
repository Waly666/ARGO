import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import QRCode from 'qrcode';

import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import { buildJornadaAlumnoQrPayload } from '../jornadas/jornada-alumno-qr.util';

/** Miniatura QR para tarjetas del listado de alumnos de jornadas. */
@Component({
  selector: 'argo-alumno-jornada-qr-thumb',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="jor-qr-thumb" [title]="'QR ' + nombreMostrar()">
      @if (qrDataUrl(); as src) {
        <img [src]="src" alt="Código QR del alumno" />
      } @else {
        <span>{{ placeholder() }}</span>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        flex-shrink: 0;
      }
      .jor-qr-thumb {
        width: 88px;
        height: 88px;
        border-radius: 10px;
        overflow: hidden;
        background: #fff;
        border: 1px solid rgba(20, 184, 166, 0.55);
        display: grid;
        place-items: center;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12);
      }
      img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
      }
      span {
        font-size: 0.7rem;
        font-weight: 750;
        color: #0f766e;
        text-align: center;
        padding: 4px;
      }
    `,
  ],
})
export class AlumnoJornadaQrThumbComponent {
  numDoc = input<string | number | null | undefined>('');
  nombre = input<string | null | undefined>('');

  qrDataUrl = signal<string | null>(null);

  docMostrar = computed(() => {
    const raw = this.numDoc();
    return formatNumDoc(raw ?? '') || String(raw ?? '').replace(/\D/g, '');
  });

  nombreMostrar = computed(
    () => String(this.nombre() || '').trim() || this.docMostrar(),
  );

  placeholder = computed(() => {
    const n = this.nombreMostrar();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (n.slice(0, 2) || 'QR').toUpperCase();
  });

  constructor() {
    effect(() => {
      const doc = this.docMostrar();
      const nom = this.nombreMostrar();
      if (doc.length < 5) {
        this.qrDataUrl.set(null);
        return;
      }
      void this.generar(doc, nom);
    });
  }

  private async generar(numDoc: string, nombre: string): Promise<void> {
    try {
      const payload = buildJornadaAlumnoQrPayload(numDoc, nombre);
      const url = await QRCode.toDataURL(payload, {
        width: 176,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      this.qrDataUrl.set(url);
    } catch (e) {
      console.error('[jor-qr-thumb]', e);
      this.qrDataUrl.set(null);
    }
  }
}
