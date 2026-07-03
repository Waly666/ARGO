import { Injectable, signal } from '@angular/core';

export interface MetaAlumnosJornadaAlerta {
  id: string;
  idJornada: string;
  alumnosLleva: number;
  metaAlumnos: number;
  metaSuperada: boolean;
  mensaje: string;
  contratoLabel?: string;
}

export type MetaJornadaResp = {
  idJornada?: string | null;
  alumnosLleva?: number;
  metaAlumnos?: number;
  metaAlcanzada?: boolean;
  metaSuperada?: boolean;
  mensaje?: string | null;
} | null | undefined;

@Injectable({ providedIn: 'root' })
export class MetaAlumnosJornadaAlertService {
  /** Una alerta por jornada (alcanzada o superada). */
  private vistos = new Set<string>();
  private readonly _alertas = signal<MetaAlumnosJornadaAlerta[]>([]);

  readonly alertas = this._alertas.asReadonly();

  /**
   * Notifica si la respuesta trae meta alcanzada/superada.
   * No repite la misma jornada hasta descartar o recargar sesión.
   */
  notificarDesdeRespuesta(
    meta: MetaJornadaResp,
    opts?: { contratoLabel?: string; forzar?: boolean },
  ) {
    if (!meta?.metaAlcanzada || !meta.mensaje) return;
    const idJornada = String(meta.idJornada || '').trim();
    if (!idJornada) return;
    const key = meta.metaSuperada ? `${idJornada}:superada` : `${idJornada}:alcanzada`;
    if (!opts?.forzar && this.vistos.has(key)) return;
    if (this._alertas().some((a) => a.id === key)) return;

    const alerta: MetaAlumnosJornadaAlerta = {
      id: key,
      idJornada,
      alumnosLleva: Number(meta.alumnosLleva) || 0,
      metaAlumnos: Number(meta.metaAlumnos) || 0,
      metaSuperada: !!meta.metaSuperada,
      mensaje: String(meta.mensaje),
      contratoLabel: opts?.contratoLabel,
    };
    this._alertas.update((list) => [alerta, ...list].slice(0, 8));
    this.reproducirAlarma();
  }

  notificarDesdeJornadaListado(
    j: {
      _id?: string;
      metaAlcanzada?: boolean;
      metaSuperada?: boolean;
      alumnosLleva?: number;
      metaAlumnos?: number;
      numeObjeJornada?: number;
      contratoLabel?: string;
      codContrato?: string;
    },
  ) {
    const metaAlumnos = Number(j.metaAlumnos ?? j.numeObjeJornada) || 0;
    const alumnosLleva = Number(j.alumnosLleva) || 0;
    const metaAlcanzada =
      j.metaAlcanzada === true || (metaAlumnos > 0 && alumnosLleva >= metaAlumnos);
    const metaSuperada =
      j.metaSuperada === true || (metaAlumnos > 0 && alumnosLleva > metaAlumnos);
    if (!metaAlcanzada) return;
    this.notificarDesdeRespuesta(
      {
        idJornada: j._id,
        alumnosLleva,
        metaAlumnos,
        metaAlcanzada,
        metaSuperada,
        mensaje: metaSuperada
          ? `Se superó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`
          : `Se alcanzó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`,
      },
      { contratoLabel: j.contratoLabel || j.codContrato },
    );
  }

  descartar(id: string) {
    const key = String(id || '');
    if (key) this.vistos.add(key);
    this._alertas.update((list) => list.filter((a) => a.id !== key));
  }

  descartarTodas() {
    for (const a of this._alertas()) this.vistos.add(a.id);
    this._alertas.set([]);
  }

  private reproducirAlarma() {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      const beep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.08, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
        osc.start(now + start);
        osc.stop(now + start + dur);
      };
      beep(880, 0, 0.18);
      beep(1174, 0.2, 0.22);
    } catch {
      /* ignore */
    }
  }
}
