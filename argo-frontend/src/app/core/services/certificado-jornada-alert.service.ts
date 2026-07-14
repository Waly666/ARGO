import { Injectable, signal } from '@angular/core';
import type { TipoCertificadoId } from '../constants/tipos-certificado';

export interface CertificadoJornadaAlerta {
  id: string;
  codigoCert?: string;
  nombreCompleto?: string;
  encabezado?: string;
  numDoc?: number | string;
  fechaEmision?: string;
  tipoFormatoCert?: TipoCertificadoId | string;
  tipoFormatoCertLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class CertificadoJornadaAlertService {
  private vistos = new Set<string>();
  private readonly _alertas = signal<CertificadoJornadaAlerta[]>([]);

  readonly alertas = this._alertas.asReadonly();

  notificarDesdeRespuesta(
    cert: Record<string, unknown> | null | undefined,
    nombreAlumno?: string,
    opts?: { silencioso?: boolean },
  ) {
    if (!cert) return;
    const id = String(cert['_id'] || cert['id'] || '');
    if (!id) return;
    this.notificar(
      {
        id,
        codigoCert: String(cert['codigoCert'] || ''),
        nombreCompleto: nombreAlumno || String(cert['nombreCompleto'] || ''),
        encabezado: String(cert['encabezado'] || ''),
        numDoc: cert['numDoc'] as number | string | undefined,
        fechaEmision: cert['fechaEmision'] ? String(cert['fechaEmision']) : undefined,
        tipoFormatoCert: cert['tipoFormatoCert'] ? String(cert['tipoFormatoCert']) : undefined,
        tipoFormatoCertLabel: cert['tipoFormatoCertLabel']
          ? String(cert['tipoFormatoCertLabel'])
          : undefined,
      },
      opts,
    );
  }

  notificarVariosDesdeRespuesta(
    items: Array<{ certificado?: Record<string, unknown> | null; nombreAlumno?: string }> | null | undefined,
  ) {
    let agregados = 0;
    for (const item of items || []) {
      const before = this._alertas().length;
      this.notificarDesdeRespuesta(item?.certificado, item?.nombreAlumno, { silencioso: true });
      if (this._alertas().length > before) agregados += 1;
    }
    if (agregados > 0) this.reproducirAlarma();
  }

  notificar(alerta: CertificadoJornadaAlerta, opts?: { silencioso?: boolean }) {
    const id = String(alerta.id || '');
    if (!id || this.vistos.has(id)) return;
    if (this._alertas().some((a) => a.id === id)) return;
    this._alertas.update((list) => [alerta, ...list].slice(0, 12));
    if (!opts?.silencioso) this.reproducirAlarma();
  }

  descartar(id: string) {
    const key = String(id || '');
    if (key) this.vistos.add(key);
    this._alertas.update((list) => list.filter((a) => a.id !== key));
  }

  descartarTodas() {
    const actuales = this._alertas();
    if (!actuales.length) return;
    for (const a of actuales) this.vistos.add(a.id);
    this._alertas.set([]);
  }

  /** Evita re-alertar certificados ya conocidos al iniciar sesión o tras cargar listado. */
  marcarConocidos(ids: string[]) {
    for (const id of ids) {
      const k = String(id || '');
      if (k) this.vistos.add(k);
    }
  }

  idsConocidos(): string[] {
    return [...this.vistos];
  }

  private reproducirAlarma() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const startBeeps = () => {
        const now = ctx.currentTime;
        const beep = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + start);
          gain.gain.setValueAtTime(0, now + start);
          gain.gain.linearRampToValueAtTime(0.1, now + start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
          osc.start(now + start);
          osc.stop(now + start + dur);
        };
        beep(740, 0, 0.16);
        beep(988, 0.18, 0.2);
        beep(1174, 0.4, 0.22);
      };
      if (ctx.state === 'suspended') {
        void ctx.resume().then(startBeeps).catch(() => startBeeps());
      } else {
        startBeeps();
      }
    } catch {
      /* ignore */
    }
  }
}
