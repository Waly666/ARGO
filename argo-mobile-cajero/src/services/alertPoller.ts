import {
  fetchAlertasCatalogos,
  fetchAlertasAutorizacionAdmin,
  fetchAlertasAutorizacionMias,
  fetchAlertasDocsEmpleados,
  fetchAlertasDocsEmpleadosFaltantes,
  fetchAlertasDocsVehiculos,
  fetchAlertasDocsVehiculosFaltantes,
  fetchAlertasInspeccionVehiculos,
  fetchAlertasPagoHoy,
  fetchAulaVirtualAccesoPorVencer,
  fetchAulaVirtualAlertasEventos,
  fetchCajaActiva,
  fetchCertificadosPorVencer,
  fetchCertificadosRecientes,
  fetchCertificadosVencidos,
  fetchComprobantesRecientes,
  fetchConfigAlertas,
  fetchConsignacionesPendientes,
  fetchDescuadresCaja,
  fetchForoAlertasRecientes,
  fetchJornadasEnProceso,
} from '../api/client';
import type { AuthUser, ComprobanteHoyTipo } from '../api/types';
import { tieneAlarma, tienePermiso } from '../utils/permisos';
import * as alertRuntime from './alertRuntime';
import { playAlertFeedback } from './alertSound';
import * as alertStore from './alertStore';
import { clearAllAlertNotifications } from './systemNotifications';

type PollCtx = {
  user: AuthUser;
  sound: boolean;
  vibration: boolean;
};

let timer: ReturnType<typeof setInterval> | null = null;
let ctx: PollCtx | null = null;
let pollInicial = true;

function habilitada(key: string): boolean {
  if (!ctx) return false;
  if (!alertRuntime.esAlarmaMovilCajero(key)) return false;
  if (!tieneAlarma(ctx.user.alarmas, key)) return false;
  return alertRuntime.activaGlobal(key);
}

function habilitadaComprobante(tipo: ComprobanteHoyTipo): boolean {
  return habilitada(alertRuntime.claveComprobante(tipo));
}

async function notificarSiNueva(nueva: boolean, critico?: boolean): Promise<void> {
  if (!nueva || !ctx) return;
  await playAlertFeedback({
    sound: ctx.sound,
    vibration: ctx.vibration,
    critico,
  });
}

function numAlertas(data: { totalAlertas?: number; total?: number; items?: unknown[] } | null | undefined): number {
  if (!data) return 0;
  const t = Number(data.totalAlertas ?? data.total);
  if (Number.isFinite(t) && t > 0) return t;
  if (Array.isArray(data.items)) return data.items.length;
  return 0;
}

async function pollOnce(): Promise<void> {
  if (!ctx) return;

  if (habilitada('alarmas.caja.cerrada') && tienePermiso(ctx.user.permisos, 'caja.turno')) {
    try {
      const caja = await fetchCajaActiva();
      const n = alertStore.syncCajaCerrada(!!caja.abierta, true);
      await notificarSiNueva(n, true);
    } catch {
      /* sin permiso o red */
    }
  }

  if (habilitada('alarmas.caja.descuadres') && tienePermiso(ctx.user.permisos, 'caja.admin')) {
    try {
      const rows = await fetchDescuadresCaja();
      const n = alertStore.syncDescuadres(Array.isArray(rows) ? rows.length : 0, true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.caja.alerta_pago')) {
    try {
      const rows = await fetchAlertasPagoHoy();
      const n = alertStore.syncAlertasPagoHoy(Array.isArray(rows) ? rows.length : 0, true);
      await notificarSiNueva(n);
    } catch {
      /* ignore */
    }
  }

  const puedeComp =
    habilitadaComprobante('ingreso') ||
    habilitadaComprobante('egreso') ||
    habilitadaComprobante('factura');
  if (puedeComp) {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const desde = inicioHoy.toISOString();
    try {
      const rows = await fetchComprobantesRecientes(desde);
      for (const row of rows || []) {
        const clave = alertRuntime.claveComprobante(String(row.tipo));
        const id = `${row.tipo}:${row.id}`;
        if (pollInicial && !alertRuntime.ventanaInicioDia(clave)) {
          alertStore.marcarConocido(id);
          continue;
        }
        const n = alertStore.syncComprobante(row, habilitadaComprobante);
        await notificarSiNueva(n);
      }
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.jornadas.en_proceso')) {
    try {
      const rows = await fetchJornadasEnProceso();
      const n = alertStore.syncJornadasEnProceso(Array.isArray(rows) ? rows.length : 0, true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.jornadas.certificado_nuevo')) {
    const desde = new Date(Date.now() - 60 * 60_000).toISOString();
    try {
      const rows = await fetchCertificadosRecientes(desde);
      for (const c of rows || []) {
        const n = alertStore.syncCertificadoNuevo(c, true);
        await notificarSiNueva(n);
      }
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.certificados.vencimiento')) {
    const dias = alertRuntime.regla('alarmas.certificados.vencimiento').diasAntelacion || 15;
    try {
      const data = await fetchCertificadosPorVencer(dias);
      const total = Number((data as { total?: number })?.total ?? (data as { items?: unknown[] })?.items?.length ?? 0);
      const n = alertStore.syncCertVencimiento(total, true);
      await notificarSiNueva(n);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.certificados.vencidos')) {
    const dias = alertRuntime.regla('alarmas.certificados.vencidos').diasGracia || 3;
    try {
      const data = await fetchCertificadosVencidos(dias);
      const total = Number((data as { total?: number })?.total ?? (data as { items?: unknown[] })?.items?.length ?? 0);
      const n = alertStore.syncCertVencidos(total, true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.empleados.docs_vencidos')) {
    try {
      const data = await fetchAlertasDocsEmpleados();
      const n = alertStore.syncEmpleadosDocsVencidos(numAlertas(data), true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.empleados.docs_faltantes')) {
    try {
      const data = await fetchAlertasDocsEmpleadosFaltantes();
      const n = alertStore.syncEmpleadosDocsFaltantes(numAlertas(data), true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.vehiculos.docs_vencidos')) {
    try {
      const data = await fetchAlertasDocsVehiculos();
      const n = alertStore.syncVehiculosDocsVencidos(numAlertas(data), true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.vehiculos.docs_faltantes')) {
    try {
      const data = await fetchAlertasDocsVehiculosFaltantes();
      const n = alertStore.syncVehiculosDocsFaltantes(numAlertas(data), true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.vehiculos.inspeccion_pendiente')) {
    try {
      const data = await fetchAlertasInspeccionVehiculos();
      const n = alertStore.syncVehiculosInspeccionPendiente(numAlertas(data), true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.config.autorizacion_pendiente')) {
    try {
      const rows = await fetchAlertasAutorizacionAdmin();
      const n = alertStore.syncAutorizacionesPendientes(Array.isArray(rows) ? rows.length : 0, true);
      await notificarSiNueva(n, true);
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.config.autorizacion_resuelta')) {
    try {
      const rows = await fetchAlertasAutorizacionMias();
      const n = alertStore.syncAutorizacionesResueltas(Array.isArray(rows) ? rows.length : 0, true);
      await notificarSiNueva(n);
    } catch {
      /* ignore */
    }
  }

  const puedeAulaVirtual = tienePermiso(ctx.user.permisos, ['aula_virtual.ver', 'aula_virtual.gestionar']);
  const pollRegistro = habilitada('alarmas.aula_virtual.registro_nuevo');
  const pollMatricula = habilitada('alarmas.aula_virtual.matricula_nueva');
  if ((pollRegistro || pollMatricula) && puedeAulaVirtual) {
    try {
      const params = new URLSearchParams();
      if (pollRegistro) {
        const minReg = Math.max(
          5,
          alertRuntime.regla('alarmas.aula_virtual.registro_nuevo').duracionMinutos || 120,
        );
        params.set('minutosRegistro', String(minReg));
      }
      if (pollMatricula) {
        const minMat = Math.max(
          5,
          alertRuntime.regla('alarmas.aula_virtual.matricula_nueva').duracionMinutos || 120,
        );
        params.set('minutosMatricula', String(minMat));
      }
      const data = await fetchAulaVirtualAlertasEventos(params.toString());
      if (pollRegistro) {
        for (const e of data.registro || []) {
          const kid = `av:registro:${e.id}`;
          if (pollInicial) {
            alertStore.marcarConocido(kid);
            continue;
          }
          const n = alertStore.syncAulaVirtualRegistro(e, true);
          await notificarSiNueva(n);
        }
      }
      if (pollMatricula) {
        for (const e of data.matricula || []) {
          const kid = `av:matricula:${e.id}`;
          if (pollInicial) {
            alertStore.marcarConocido(kid);
            continue;
          }
          const n = alertStore.syncAulaVirtualMatricula(e, true);
          await notificarSiNueva(n);
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (habilitada('alarmas.aula_virtual.acceso_por_vencer') && puedeAulaVirtual) {
    try {
      const dias = alertRuntime.regla('alarmas.aula_virtual.acceso_por_vencer').diasAntelacion || 1;
      const data = await fetchAulaVirtualAccesoPorVencer(dias);
      const total = Number(data?.total ?? 0);
      const n = alertStore.syncAulaVirtualAccesoPorVencer(total, true);
      await notificarSiNueva(n);
    } catch {
      /* ignore */
    }
  }

  if (
    habilitada('alarmas.aula_virtual.consignacion_pendiente') &&
    tienePermiso(ctx.user.permisos, 'caja.admin')
  ) {
    try {
      const rows = await fetchConsignacionesPendientes();
      for (const r of rows || []) {
        const kid = `av:consignacion:${r.id}`;
        if (pollInicial) {
          alertStore.marcarConocido(kid);
          continue;
        }
        const n = alertStore.syncConsignacionPendiente(r, true);
        await notificarSiNueva(n, true);
      }
    } catch {
      /* ignore */
    }
  }

  if (
    habilitada('alarmas.aula_virtual.foro_mensaje') &&
    tienePermiso(ctx.user.permisos, ['aula_virtual.foro', 'aula_virtual.gestionar'])
  ) {
    try {
      const min = Math.max(5, alertRuntime.regla('alarmas.aula_virtual.foro_mensaje').duracionMinutos || 120);
      const rows = await fetchForoAlertasRecientes(min);
      for (const m of rows || []) {
        const kid = `av:foro:${m.id}`;
        if (pollInicial) {
          alertStore.marcarConocido(kid);
          continue;
        }
        const n = alertStore.syncForoMensaje(m, true);
        await notificarSiNueva(n);
      }
    } catch {
      /* ignore */
    }
  }
}

const POLL_KEYS = [
  'alarmas.caja.cerrada',
  'alarmas.caja.descuadres',
  'alarmas.caja.alerta_pago',
  'alarmas.alumnos.comprobante_ingreso',
  'alarmas.alumnos.comprobante_egreso',
  'alarmas.alumnos.factura',
  'alarmas.jornadas.en_proceso',
  'alarmas.jornadas.certificado_nuevo',
  'alarmas.certificados.vencimiento',
  'alarmas.certificados.vencidos',
  'alarmas.empleados.docs_vencidos',
  'alarmas.empleados.docs_faltantes',
  'alarmas.vehiculos.docs_vencidos',
  'alarmas.vehiculos.docs_faltantes',
  'alarmas.vehiculos.inspeccion_pendiente',
  'alarmas.config.autorizacion_pendiente',
  'alarmas.config.autorizacion_resuelta',
  'alarmas.aula_virtual.registro_nuevo',
  'alarmas.aula_virtual.matricula_nueva',
  'alarmas.aula_virtual.acceso_por_vencer',
  'alarmas.aula_virtual.consignacion_pendiente',
  'alarmas.aula_virtual.foro_mensaje',
];

export async function startAlertPoller(c: PollCtx): Promise<void> {
  stopAlertPoller();
  ctx = c;
  try {
    const [cfg, cat] = await Promise.all([fetchConfigAlertas(), fetchAlertasCatalogos()]);
    alertRuntime.aplicarReglasAlertas(cfg.reglas || []);
    alertRuntime.aplicarClavesMovilCajero(cat.clavesMovilCajero || []);
  } catch {
    alertRuntime.aplicarReglasAlertas([]);
    alertRuntime.aplicarClavesMovilCajero([]);
  }
  await pollOnce();
  pollInicial = false;
  const ms = alertRuntime.pollIntervalMs(POLL_KEYS, habilitada);
  timer = setInterval(() => {
    void pollOnce();
  }, ms);
}

export function stopAlertPoller(): void {
  if (timer) clearInterval(timer);
  timer = null;
  ctx = null;
  pollInicial = true;
  alertStore.clearAll();
  void clearAllAlertNotifications();
}

export function refreshPollInterval(): void {
  if (!timer || !ctx) return;
  clearInterval(timer);
  const ms = alertRuntime.pollIntervalMs(POLL_KEYS, habilitada);
  timer = setInterval(() => {
    void pollOnce();
  }, ms);
}
