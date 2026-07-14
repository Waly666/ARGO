import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import QRCode from 'qrcode';

import { formatNumDoc } from '../../core/utils/num-doc.helpers';
import {
  buildJornadaAlumnoQrPayload,
  fmtFechaEtiqueta,
} from '../jornadas/jornada-alumno-qr.util';
import { JornadaEtiquetaQrService } from '../jornadas/jornada-etiqueta-qr.service';

/**
 * Panel embebido en la ficha del alumno (modo jornadas):
 * muestra el QR para etiqueta e impresión.
 */
@Component({
  selector: 'argo-alumno-jornada-qr-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="jor-qr-panel">
      <div class="jor-qr-head">
        <strong>QR jornadas</strong>
        <span>Escanear en la app del instructor</span>
      </div>

      @if (!docValido()) {
        <div class="jor-qr-box jor-qr-box--empty">
          <span>Guarde el alumno con documento para generar el QR</span>
        </div>
      } @else {
        <div class="jor-qr-box">
          @if (qrDataUrl(); as src) {
            <img [src]="src" alt="Código QR del alumno" width="132" height="132" />
          } @else if (error()) {
            <span class="jor-qr-err">{{ error() }}</span>
          } @else {
            <span class="jor-qr-loading">Generando QR…</span>
          }
        </div>
        <p class="jor-qr-meta">
          <strong>{{ nombreMostrar() }}</strong>
          <span>Doc. {{ docMostrar() }}</span>
          <span class="jor-qr-empresa">{{ empresaMostrar() }}</span>
          @if (contratoMostrar()) {
            <span class="jor-qr-contrato">Contrato {{ contratoMostrar() }}</span>
          }
          <span class="jor-qr-fecha">Jornada {{ fechaMostrar() }}</span>
        </p>
        <button
          type="button"
          class="primary mini"
          (click)="imprimir()"
          [disabled]="imprimiendo() || !qrDataUrl()">
          {{ imprimiendo() ? 'Abriendo…' : 'Imprimir etiqueta' }}
        </button>
        @if (msg()) {
          <p class="jor-qr-hint">{{ msg() }}</p>
        }
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .jor-qr-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem;
        border-radius: 12px;
        border: 2px solid #14b8a6;
        background: #ecfdf5;
        color: #134e4a;
        box-shadow: 0 4px 14px rgba(13, 148, 136, 0.2);
      }
      .jor-qr-head {
        text-align: center;
        strong {
          display: block;
          font-size: 0.9rem;
          color: #0f766e;
        }
        span {
          display: block;
          font-size: 0.72rem;
          color: #0f766e;
          opacity: 0.85;
          line-height: 1.25;
          margin-top: 2px;
        }
      }
      .jor-qr-box {
        width: 140px;
        height: 140px;
        background: #fff;
        border-radius: 10px;
        border: 1px solid #99f6e4;
        display: grid;
        place-items: center;
        overflow: hidden;
        img {
          width: 132px;
          height: 132px;
          object-fit: contain;
        }
      }
      .jor-qr-box--empty {
        height: auto;
        min-height: 72px;
        padding: 0.75rem;
        span {
          font-size: 0.75rem;
          text-align: center;
          color: #0f766e;
        }
      }
      .jor-qr-loading,
      .jor-qr-err {
        font-size: 0.75rem;
        color: #64748b;
        padding: 0.5rem;
        text-align: center;
      }
      .jor-qr-err {
        color: #b91c1c;
      }
      .jor-qr-meta {
        margin: 0;
        text-align: center;
        strong {
          display: block;
          font-size: 0.8rem;
          line-height: 1.2;
          color: #134e4a;
        }
        span {
          display: block;
          font-size: 0.75rem;
          color: #0f766e;
          margin-top: 2px;
        }
        .jor-qr-empresa {
          font-weight: 700;
          margin-top: 4px !important;
        }
        .jor-qr-contrato {
          font-weight: 700;
          color: #1e3a8a !important;
          margin-top: 2px !important;
        }
        .jor-qr-fecha {
          font-weight: 700;
          color: #334155 !important;
        }
      }
      .jor-qr-hint {
        margin: 0;
        font-size: 0.7rem;
        color: #b45309;
        text-align: center;
      }
      button.mini {
        width: 100%;
      }
    `,
  ],
})
export class AlumnoJornadaQrPanelComponent {
  private etiquetaSvc = inject(JornadaEtiquetaQrService);

  numDoc = input<string | number | null | undefined>('');
  nombre = input<string | null | undefined>('');
  empresa = input<string | null | undefined>('');
  codContrato = input<string | null | undefined>('');
  fechaJornada = input<string | null | undefined>('');

  qrDataUrl = signal<string | null>(null);
  error = signal<string | null>(null);
  imprimiendo = signal(false);
  msg = signal<string | null>(null);

  docMostrar = computed(() => {
    const raw = this.numDoc();
    return formatNumDoc(raw ?? '') || String(raw ?? '').replace(/\D/g, '');
  });

  nombreMostrar = computed(
    () => String(this.nombre() || '').trim() || this.docMostrar(),
  );

  empresaMostrar = computed(
    () => String(this.empresa() || '').trim() || '—',
  );

  contratoMostrar = computed(
    () => String(this.codContrato() || '').trim(),
  );

  fechaMostrar = computed(() => fmtFechaEtiqueta(this.fechaJornada()));

  docValido = computed(() => this.docMostrar().length >= 5);

  constructor() {
    effect(() => {
      const doc = this.docMostrar();
      const nom = this.nombreMostrar();
      if (doc.length < 5) {
        this.qrDataUrl.set(null);
        this.error.set(null);
        return;
      }
      void this.generar(doc, nom);
    });
  }

  private async generar(numDoc: string, nombre: string): Promise<void> {
    this.error.set(null);
    try {
      const payload = buildJornadaAlumnoQrPayload(numDoc, nombre);
      const url = await QRCode.toDataURL(payload, {
        width: 280,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      this.qrDataUrl.set(url);
    } catch (e) {
      console.error('[jor-qr]', e);
      this.qrDataUrl.set(null);
      this.error.set('No se pudo generar el QR');
    }
  }

  async imprimir(): Promise<void> {
    const doc = this.docMostrar();
    const nom = this.nombreMostrar();
    if (doc.length < 5) return;
    this.imprimiendo.set(true);
    this.msg.set(null);
    try {
      await this.etiquetaSvc.imprimirUna(doc, nom, {
        empresa: this.empresaMostrar() === '—' ? '' : this.empresaMostrar(),
        codContrato: this.contratoMostrar() || '',
        fechaJornada: this.fechaJornada() || this.fechaMostrar(),
      });
    } catch (e) {
      this.msg.set(e instanceof Error ? e.message : 'No se pudo imprimir');
    } finally {
      this.imprimiendo.set(false);
    }
  }
}
