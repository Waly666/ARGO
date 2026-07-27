import { Injectable, inject, signal } from '@angular/core';

import { CertificadoJornadaAlertService } from './certificado-jornada-alert.service';
import { JornadaCapService } from './jornada-cap.service';

export type JornadaLiveToastKind = 'clase' | 'jornada' | 'clase-inicio' | 'clase-fin';

export interface JornadaLiveCertResumen {
  id?: string;
  codigo?: string;
  nombre?: string;
}

export interface JornadaLiveToast {
  id: string;
  kind: JornadaLiveToastKind;
  titulo: string;
  detalle: string;
  /** No se cierra sola (p. ej. clase en curso o fin con certificados). */
  sticky?: boolean;
  claseId?: string;
  certificados?: JornadaLiveCertResumen[];
}

export interface JornadaClaseEnCurso {
  id: string;
  titulo: string;
  detalle: string;
}

type CertEmitidoItem = {
  certificado?: Record<string, unknown> | null;
  nombreAlumno?: string;
};

const TOAST_MS = 3000;
const TOAST_FIN_MS = 20000;

@Injectable({ providedIn: 'root' })
export class JornadaLiveSyncService {
  private jornadaSvc = inject(JornadaCapService);
  private certAlertSvc = inject(CertificadoJornadaAlertService);

  private clasesConocidas = new Set<string>();
  private jornadasConocidas = new Set<string>();
  private claseEstados = new Map<string, string>();
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private pollListo = false;
  private certFetchEnCurso = new Set<string>();
  private postCierreTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private postCierreGen = new Map<string, number>();

  private readonly _toast = signal<JornadaLiveToast | null>(null);
  private readonly _clasesEnCurso = signal<JornadaClaseEnCurso[]>([]);
  private readonly _refreshTick = signal(0);

  readonly toast = this._toast.asReadonly();
  readonly clasesEnCurso = this._clasesEnCurso.asReadonly();
  readonly refreshTick = this._refreshTick.asReadonly();

  marcarPollInicializado() {
    this.pollListo = true;
  }

  pollEstaListo(): boolean {
    return this.pollListo;
  }

  marcarClasesConocidas(ids: Array<string | undefined | null>) {
    for (const id of ids) {
      const k = String(id || '');
      if (k) this.clasesConocidas.add(k);
    }
  }

  marcarJornadasConocidas(ids: Array<string | undefined | null>) {
    for (const id of ids) {
      const k = String(id || '');
      if (k) this.jornadasConocidas.add(k);
    }
  }

  sincronizarEstadosClases(clases: Array<Record<string, unknown> | { _id?: string; estado?: string }>) {
    for (const c of clases || []) {
      const id = String(c._id || (c as Record<string, unknown>)['_id'] || '');
      if (!id) continue;
      this.claseEstados.set(id, this.normEstado(String(c.estado || (c as Record<string, unknown>)['estado'] || '')));
    }
  }

  /**
   * Tras el poll inicial: deja visibles las clases ya EN PROCESO
   * (la alarma permanece mientras la clase esté activa).
   */
  restaurarClasesEnCurso(clases: Array<Record<string, unknown> | { _id?: string; estado?: string }>) {
    const activas: JornadaClaseEnCurso[] = [];
    for (const raw of clases || []) {
      const c = raw as Record<string, unknown>;
      const id = String(c['_id'] || '');
      if (!id) continue;
      const estado = this.normEstado(String(c['estado'] || ''));
      this.claseEstados.set(id, estado);
      if (estado === 'EN PROCESO') {
        activas.push({
          id,
          titulo: 'Clase en curso',
          detalle: this.detalleClase(c),
        });
      }
    }
    this._clasesEnCurso.set(activas);
  }

  registrarClaseLocal(clase: { _id?: string; estado?: string }) {
    const id = String(clase?._id || '');
    if (!id) return;
    this.clasesConocidas.add(id);
    this.claseEstados.set(id, this.normEstado(String(clase.estado || '')));
  }

  registrarJornadasLocales(jornadas: Array<{ _id?: string }>) {
    for (const j of jornadas || []) this.registrarJornadaLocal(j);
  }

  registrarJornadaLocal(jornada: { _id?: string }) {
    const id = String(jornada?._id || '');
    if (id) this.jornadasConocidas.add(id);
  }

  procesarPoll(clases: Array<Record<string, unknown>>, jornadas: Array<Record<string, unknown>>) {
    let hayCambio = false;

    for (const j of jornadas || []) {
      const id = String(j['_id'] || '');
      if (!id || this.jornadasConocidas.has(id)) continue;
      this.jornadasConocidas.add(id);
      hayCambio = true;
      this.mostrarToastJornada(j);
    }

    for (const c of clases || []) {
      const id = String(c['_id'] || '');
      if (!id) continue;

      if (!this.clasesConocidas.has(id)) {
        this.clasesConocidas.add(id);
        this.claseEstados.set(id, this.normEstado(String(c['estado'] || '')));
        hayCambio = true;
        this.mostrarToastClase(c);
        if (this.normEstado(String(c['estado'] || '')) === 'EN PROCESO') {
          this.upsertClaseEnCurso(c);
        }
        continue;
      }

      if (this.detectarCambioEstadoClase(c)) hayCambio = true;
    }

    // Mantener sticky solo mientras el poll diga EN PROCESO
    const enProcesoIds = new Set(
      (clases || [])
        .filter((c) => this.normEstado(String(c['estado'] || '')) === 'EN PROCESO')
        .map((c) => String(c['_id'] || ''))
        .filter(Boolean),
    );
    const prev = this._clasesEnCurso();
    const filtradas = prev.filter((x) => enProcesoIds.has(x.id));
    if (filtradas.length !== prev.length) {
      this._clasesEnCurso.set(filtradas);
      hayCambio = true;
    }

    if (hayCambio) this._refreshTick.update((n) => n + 1);
  }

  notificarClaseIniciada(
    clase:
      | Record<string, unknown>
      | {
          _id?: string;
          estado?: string;
          programaNombre?: string;
          instructorNombre?: string;
          idPrograma?: string;
          idinstructor?: string;
        },
  ) {
    const c = clase as Record<string, unknown>;
    const id = String(c['_id'] || '');
    if (id) this.claseEstados.set(id, 'EN PROCESO');
    this.upsertClaseEnCurso(c);
    this._refreshTick.update((n) => n + 1);
  }

  notificarClaseFinalizada(
    clase:
      | Record<string, unknown>
      | {
          _id?: string;
          estado?: string;
          duracionSegundos?: number | null;
          programaNombre?: string;
          instructorNombre?: string;
          idPrograma?: string;
          idinstructor?: string;
        },
    opts?: {
      certificadosEmitidos?: CertEmitidoItem[] | null;
      /** Si true, no vuelve a empujar al banner de certificados (ya se notificó fuera). */
      certificadosYaNotificados?: boolean;
      /** Espera GET /post-cierre para certs (finalizar async). */
      esperarPostCierre?: boolean;
    },
  ) {
    const c = clase as Record<string, unknown>;
    const id = String(c['_id'] || '');
    if (id) {
      this.claseEstados.set(id, 'FINALIZADO');
      this.quitarClaseEnCurso(id);
    }

    const emitidos = opts?.certificadosEmitidos || [];
    if (!opts?.certificadosYaNotificados && emitidos.length) {
      this.certAlertSvc.notificarVariosDesdeRespuesta(emitidos);
    }

    this.mostrarToastClaseFinalizada(c, this.resumenDesdeEmitidos(emitidos));
    this._refreshTick.update((n) => n + 1);

    if (opts?.esperarPostCierre && id) {
      this.esperarPostCierreClase(id, c);
    }
  }

  /**
   * Consulta rápida del post-cierre async (~0.5s) para mostrar certificados
   * sin esperar el poll de 45–60s de cabecera.
   */
  esperarPostCierreClase(claseId: string, clase: Record<string, unknown>) {
    const id = String(claseId || '');
    if (!id) return;
    const prev = this.postCierreTimers.get(id);
    if (prev) clearTimeout(prev);
    const gen = (this.postCierreGen.get(id) || 0) + 1;
    this.postCierreGen.set(id, gen);

    const started = Date.now();
    const MAX_MS = 120_000;
    const INTERVAL_MS = 500;

    const tick = () => {
      if (this.postCierreGen.get(id) !== gen) return;
      this.jornadaSvc.obtenerPostCierreClase(id).subscribe({
        next: (r) => {
          if (this.postCierreGen.get(id) !== gen) return;
          if (r?.status === 'pending' || r?.status === 'unknown') {
            if (Date.now() - started < MAX_MS) {
              const t = setTimeout(tick, INTERVAL_MS);
              this.postCierreTimers.set(id, t);
            } else {
              this.alFinalizarDesdePoll(clase);
            }
            return;
          }
          this.postCierreTimers.delete(id);
          const emitidos = (r?.certificadosEmitidos || []) as CertEmitidoItem[];
          if (emitidos.length) {
            this.certAlertSvc.notificarVariosDesdeRespuesta(emitidos);
            this.mostrarToastClaseFinalizada(clase, this.resumenDesdeEmitidos(emitidos));
          } else if (r?.status === 'error') {
            this.mostrarToastClaseFinalizada(clase);
          }
          this._refreshTick.update((n) => n + 1);
        },
        error: () => {
          if (this.postCierreGen.get(id) !== gen) return;
          if (Date.now() - started < MAX_MS) {
            const t = setTimeout(tick, INTERVAL_MS);
            this.postCierreTimers.set(id, t);
          } else {
            this.alFinalizarDesdePoll(clase);
          }
        },
      });
    };

    const t0 = setTimeout(tick, 300);
    this.postCierreTimers.set(id, t0);
  }

  cerrarToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this._toast.set(null);
  }

  mostrarToastClase(c: Record<string, unknown>) {
    this.mostrarToast({
      id: `clase-nueva-${c['_id']}-${Date.now()}`,
      kind: 'clase',
      titulo: 'Se creó una clase',
      detalle: this.detalleClase(c),
    });
  }

  mostrarToastClaseFinalizada(c: Record<string, unknown>, certificados?: JornadaLiveCertResumen[]) {
    const dur = c['duracionSegundos'];
    const certs = certificados || [];
    const nCert = certs.length;
    const extraParts: string[] = [];
    if (dur != null && Number(dur) >= 0) {
      extraParts.push(`Duración: ${this.fmtDuracion(Number(dur))}`);
    }
    if (nCert > 0) {
      extraParts.push(`${nCert} certificado(s) generado(s)`);
    }
    const extra = extraParts.length ? extraParts.join(' · ') : undefined;
    this.mostrarToast(
      {
        id: `clase-fin-${c['_id']}-${Date.now()}`,
        kind: 'clase-fin',
        titulo: nCert > 0 ? 'Clase finalizada · certificados' : 'Clase finalizada',
        detalle: this.detalleClase(c, extra),
        sticky: nCert > 0,
        claseId: String(c['_id'] || '') || undefined,
        certificados: nCert > 0 ? certs : undefined,
      },
      nCert > 0 ? { sticky: true } : { ms: TOAST_FIN_MS },
    );
  }

  mostrarToastJornada(j: Record<string, unknown>) {
    const fecha = j['fechaProgramacion'] ? this.fmtFecha(String(j['fechaProgramacion'])) : '';
    const municipio = String(j['municipio'] || '').trim();
    const detalle = [fecha, municipio].filter(Boolean).join(' · ') || 'Nueva jornada en el contrato';
    this.mostrarToast({
      id: `jornada-${j['_id']}-${Date.now()}`,
      kind: 'jornada',
      titulo: 'Se programó una jornada',
      detalle,
    });
  }

  mostrarToastGeneracionJornadas(cantidad: number) {
    this.mostrarToast({
      id: `jornadas-gen-${Date.now()}`,
      kind: 'jornada',
      titulo: 'Jornadas generadas',
      detalle: `${cantidad} jornada(s) creada(s) en el contrato`,
    });
    this._refreshTick.update((n) => n + 1);
  }

  private detectarCambioEstadoClase(c: Record<string, unknown>): boolean {
    const id = String(c['_id'] || '');
    if (!id) return false;
    const estado = this.normEstado(String(c['estado'] || ''));
    const prev = this.claseEstados.get(id) || 'PROGRAMADA';

    if (prev === estado) {
      if (estado === 'EN PROCESO') this.upsertClaseEnCurso(c);
      return false;
    }
    this.claseEstados.set(id, estado);

    if (estado === 'EN PROCESO' && prev !== 'EN PROCESO') {
      this.upsertClaseEnCurso(c);
      return true;
    }
    if (estado === 'FINALIZADO' && prev !== 'FINALIZADO') {
      this.quitarClaseEnCurso(id);
      this.alFinalizarDesdePoll(c);
      return true;
    }
    if (estado !== 'EN PROCESO') this.quitarClaseEnCurso(id);
    return true;
  }

  private alFinalizarDesdePoll(c: Record<string, unknown>) {
    const id = String(c['_id'] || '');
    if (!id || this.certFetchEnCurso.has(id)) {
      this.mostrarToastClaseFinalizada(c);
      return;
    }
    this.certFetchEnCurso.add(id);
    this.jornadaSvc.listarCertificadosJornada({ idClase: id }).subscribe({
      next: (rows) => {
        this.certFetchEnCurso.delete(id);
        const emitidos: CertEmitidoItem[] = (rows || []).map((row) => ({
          certificado: row as Record<string, unknown>,
          nombreAlumno: String(
            (row as Record<string, unknown>)['nombreCompleto'] ||
              (row as Record<string, unknown>)['nombreAlumno'] ||
              '',
          ),
        }));
        if (emitidos.length) {
          this.certAlertSvc.notificarVariosDesdeRespuesta(emitidos);
        }
        this.mostrarToastClaseFinalizada(c, this.resumenDesdeEmitidos(emitidos));
      },
      error: () => {
        this.certFetchEnCurso.delete(id);
        this.mostrarToastClaseFinalizada(c);
      },
    });
  }

  private upsertClaseEnCurso(c: Record<string, unknown>) {
    const id = String(c['_id'] || '');
    if (!id) return;
    const item: JornadaClaseEnCurso = {
      id,
      titulo: 'Clase en curso',
      detalle: this.detalleClase(c),
    };
    this._clasesEnCurso.update((list) => {
      const i = list.findIndex((x) => x.id === id);
      if (i >= 0) {
        const next = [...list];
        next[i] = item;
        return next;
      }
      return [...list, item];
    });
  }

  private quitarClaseEnCurso(id: string) {
    const key = String(id || '');
    if (!key) return;
    this._clasesEnCurso.update((list) => list.filter((x) => x.id !== key));
  }

  private resumenDesdeEmitidos(emitidos: CertEmitidoItem[]): JornadaLiveCertResumen[] {
    return (emitidos || [])
      .map((item) => {
        const cert = item.certificado || {};
        const id = String(cert['_id'] || cert['id'] || '');
        return {
          id: id || undefined,
          codigo: String(cert['codigoCert'] || '').trim() || undefined,
          nombre:
            String(item.nombreAlumno || cert['nombreCompleto'] || '').trim() || undefined,
        };
      })
      .filter((x) => x.codigo || x.nombre || x.id);
  }

  private detalleClase(c: Record<string, unknown>, extra?: string): string {
    const programa = String(
      c['programaNombre'] || c['nombreProg'] || c['idPrograma'] || 'Programa',
    ).trim();
    const instructor = String(c['instructorNombre'] || c['idinstructor'] || '—').trim();
    const base = `${programa} · Instructor: ${instructor}`;
    return extra ? `${base} · ${extra}` : base;
  }

  private normEstado(estado: string): string {
    return String(estado || 'PROGRAMADA').trim().toUpperCase();
  }

  private fmtDuracion(seg: number): string {
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
  }

  private mostrarToast(toast: JornadaLiveToast, opts?: { sticky?: boolean; ms?: number }) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    const sticky = opts?.sticky === true || toast.sticky === true;
    this._toast.set({ ...toast, sticky });
    if (sticky) return;
    const ms = opts?.ms ?? TOAST_MS;
    this.toastTimer = setTimeout(() => {
      this._toast.set(null);
      this.toastTimer = null;
    }, ms);
  }

  private fmtFecha(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
