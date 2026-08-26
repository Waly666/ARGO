import type {
  AulaVirtualEventoAlerta,
  ConsignacionPendienteRow,
  ForoMensajeAlertaRow,
} from '../api/client';
import { certificadoHtmlPath } from '../api/certificadosApi';
import { reciboEgresoHtmlPath } from '../api/egresosApi';
import { facturaHtmlPath } from '../api/facturacionApi';
import { reciboIngresoHtmlPath } from '../api/ingresosApi';
import type { ComprobanteHoyTipo } from '../api/types';
import * as alertRuntime from './alertRuntime';
import { cancelAlertNotification, showAlertNotification } from './systemNotifications';

export type AlertaDocumento = {
  title: string;
  htmlPath: string;
};

export type AlertaItem = {
  id: string;
  clave: string;
  titulo: string;
  detalle: string;
  critico?: boolean;
  mostradaAt: number;
  route?: string;
  documento?: AlertaDocumento;
};

type Listener = () => void;

let items: AlertaItem[] = [];
const listeners = new Set<Listener>();
const conocidos = new Set<string>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function bump(): void {
  for (const fn of listeners) fn();
}

export function getAlertas(): AlertaItem[] {
  const now = Date.now();
  return items.filter((a) => {
    const ms = alertRuntime.duracionMs(a.clave);
    if (ms <= 0) return true;
    return now - a.mostradaAt < ms;
  });
}

export function dismiss(id: string): void {
  items = items.filter((a) => a.id !== id);
  void cancelAlertNotification(id);
  bump();
}

export function clearAll(): void {
  items = [];
  bump();
}

export function marcarConocido(key: string): void {
  conocidos.add(key);
}

export function marcarConocidos(keys: string[]): void {
  for (const k of keys) conocidos.add(k);
}

/** true si es nueva y debe sonar/vibrar */
export function pushAlerta(
  item: Omit<AlertaItem, 'mostradaAt'> & { mostradaAt?: number },
  opts?: { silencioso?: boolean },
): boolean {
  const id = item.id;
  const esNueva = !conocidos.has(id);
  if (!esNueva && items.some((x) => x.id === id)) return false;

  if (esNueva && !opts?.silencioso) {
    conocidos.add(id);
  } else if (!esNueva) {
    return false;
  }

  const row: AlertaItem = { ...item, mostradaAt: item.mostradaAt ?? Date.now() };
  items = [row, ...items.filter((x) => x.id !== id)].slice(0, 16);
  bump();
  if (esNueva && !opts?.silencioso) {
    void showAlertNotification(row);
  }
  return esNueva && !opts?.silencioso;
}

export function syncCajaCerrada(abierta: boolean, habilitada: boolean): boolean {
  const id = 'caja:cerrada';
  if (!habilitada || abierta) {
    items = items.filter((a) => a.id !== id);
    bump();
    return false;
  }
  return pushAlerta({
    id,
    clave: 'alarmas.caja.cerrada',
    titulo: 'Caja personal cerrada',
    detalle: 'Abra su caja para registrar movimientos.',
    critico: true,
    route: 'Caja',
  });
}

export function syncComprobante(
  row: { tipo?: string; id?: string; valor?: number; nombreCompleto?: string; numRecibo?: string | null; numeroFactura?: string | null },
  habilitada: (t: ComprobanteHoyTipo) => boolean,
): boolean {
  const tipo = String(row.tipo || '') as ComprobanteHoyTipo;
  if (tipo !== 'ingreso' && tipo !== 'egreso' && tipo !== 'factura') return false;
  if (!habilitada(tipo)) return false;
  const clave = alertRuntime.claveComprobante(tipo);
  const id = `${tipo}:${row.id}`;
  const valor = Number(row.valor) || 0;
  const nombre = String(row.nombreCompleto || '').trim();
  const label =
    tipo === 'factura'
      ? `Factura ${row.numeroFactura || ''}`.trim()
      : `${tipo === 'ingreso' ? 'Ingreso' : 'Egreso'} ${row.numRecibo || ''}`.trim();
  const docId = String(row.id || '');
  let documento: AlertaDocumento | undefined;
  if (docId) {
    if (tipo === 'factura') {
      documento = {
        title: label || 'Factura electrónica',
        htmlPath: facturaHtmlPath(docId),
      };
    } else if (tipo === 'ingreso') {
      documento = {
        title: label || 'Recibo de ingreso',
        htmlPath: reciboIngresoHtmlPath(docId),
      };
    } else {
      documento = {
        title: label || 'Recibo de egreso',
        htmlPath: reciboEgresoHtmlPath(docId),
      };
    }
  }
  return pushAlerta({
    id,
    clave,
    titulo: label,
    detalle: `${nombre || 'Movimiento'} — $${valor.toLocaleString('es-CO')}`,
    route: tipo === 'factura' ? 'Facturacion' : 'Caja',
    documento,
  });
}

export function syncCertificadoNuevo(cert: Record<string, unknown>, habilitada: boolean): boolean {
  if (!habilitada) return false;
  const id = String(cert._id || cert.id || '');
  if (!id) return false;
  const nombre = String(cert.nombreCompleto || '').trim();
  const encabezado = String(cert.encabezado || cert.nomCert || cert.programaDescr || '').trim();
  const codigo = String(cert.codigoCert || '').trim();
  const detallePartes = [nombre, encabezado || codigo].filter(Boolean);
  const docTitulo = codigo ? `Certificado ${codigo}` : encabezado ? `Certificado ${encabezado}` : 'Certificado';
  return pushAlerta({
    id: `cert:${id}`,
    clave: 'alarmas.jornadas.certificado_nuevo',
    titulo: 'Certificado emitido',
    detalle: detallePartes.join(' · ') || 'Nuevo certificado',
    route: 'Home',
    documento: {
      title: docTitulo,
      htmlPath: certificadoHtmlPath(id),
    },
  });
}

export function syncCertVencimiento(total: number, habilitada: boolean): boolean {
  const id = 'cert:vencimiento';
  if (!habilitada || total <= 0) {
    items = items.filter((a) => a.id !== id);
    bump();
    return false;
  }
  return pushAlerta({
    id,
    clave: 'alarmas.certificados.vencimiento',
    titulo: 'Certificados por vencer',
    detalle: `${total} certificado(s) próximos a vencer`,
    route: 'Home',
  });
}

export function syncCertVencidos(total: number, habilitada: boolean): boolean {
  const id = 'cert:vencidos';
  if (!habilitada || total <= 0) {
    items = items.filter((a) => a.id !== id);
    bump();
    return false;
  }
  return pushAlerta({
    id,
    clave: 'alarmas.certificados.vencidos',
    titulo: 'Certificados vencidos',
    detalle: `${total} certificado(s) vencidos`,
    critico: true,
    route: 'Home',
  });
}

export function syncDescuadres(count: number, habilitada: boolean): boolean {
  const id = 'caja:descuadres';
  if (!habilitada || count <= 0) {
    items = items.filter((a) => a.id !== id);
    bump();
    return false;
  }
  return pushAlerta({
    id,
    clave: 'alarmas.caja.descuadres',
    titulo: 'Descuadres de caja',
    detalle: `${count} descuadre(s) pendiente(s)`,
    critico: true,
    route: 'Caja',
  });
}

function syncAlertaConteo(opts: {
  id: string;
  clave: string;
  titulo: string;
  detalle: string;
  total: number;
  critico?: boolean;
  route?: string;
}): boolean {
  if (opts.total <= 0) {
    const antes = items.some((a) => a.id === opts.id);
    items = items.filter((a) => a.id !== opts.id);
    if (antes) bump();
    return false;
  }
  return pushAlerta({
    id: opts.id,
    clave: opts.clave,
    titulo: opts.titulo,
    detalle: opts.detalle,
    critico: opts.critico,
    route: opts.route,
  });
}

export function syncJornadasEnProceso(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'jornadas:en_proceso',
    clave: 'alarmas.jornadas.en_proceso',
    titulo: 'Jornadas en proceso',
    detalle: total === 1 ? '1 jornada EN PROCESO hoy' : `${total} jornadas EN PROCESO hoy`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncAlertasPagoHoy(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'caja:alerta_pago',
    clave: 'alarmas.caja.alerta_pago',
    titulo: 'Cobros programados hoy',
    detalle: total === 1 ? '1 alumno con cobro programado hoy' : `${total} alumnos con cobro programado hoy`,
    total,
    route: 'Alumnos',
  });
}

export function syncEmpleadosDocsVencidos(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'empleados:docs_vencidos',
    clave: 'alarmas.empleados.docs_vencidos',
    titulo: 'Documentos empleados por vencer',
    detalle: total === 1 ? '1 documento de empleado vencido o por vencer' : `${total} documentos de empleados`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncEmpleadosDocsFaltantes(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'empleados:docs_faltantes',
    clave: 'alarmas.empleados.docs_faltantes',
    titulo: 'Documentos empleados faltantes',
    detalle: total === 1 ? '1 documento requerido sin registrar' : `${total} documentos requeridos sin registrar`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncVehiculosDocsVencidos(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'vehiculos:docs_vencidos',
    clave: 'alarmas.vehiculos.docs_vencidos',
    titulo: 'Documentos vehículos',
    detalle: total === 1 ? '1 documento de vehículo vencido o por vencer' : `${total} documentos de vehículos`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncVehiculosDocsFaltantes(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'vehiculos:docs_faltantes',
    clave: 'alarmas.vehiculos.docs_faltantes',
    titulo: 'Documentos vehículos faltantes',
    detalle: total === 1 ? '1 documento de vehículo sin registrar' : `${total} documentos de vehículos sin registrar`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncVehiculosInspeccionPendiente(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'vehiculos:inspeccion',
    clave: 'alarmas.vehiculos.inspeccion_pendiente',
    titulo: 'Inspección vehículos pendiente',
    detalle:
      total === 1
        ? '1 vehículo sin inspección preoperacional hoy'
        : `${total} vehículos sin inspección preoperacional hoy`,
    total,
    critico: true,
    route: 'Home',
  });
}

export function syncAutorizacionesPendientes(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'config:autorizacion_pendiente',
    clave: 'alarmas.config.autorizacion_pendiente',
    titulo: 'Autorizaciones pendientes',
    detalle: total === 1 ? '1 solicitud de eliminación por autorizar' : `${total} solicitudes por autorizar`,
    total,
    critico: true,
    route: 'Autorizaciones',
  });
}

export function syncAutorizacionesResueltas(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'config:autorizacion_resuelta',
    clave: 'alarmas.config.autorizacion_resuelta',
    titulo: 'Autorización resuelta',
    detalle: total === 1 ? '1 resultado de su solicitud de eliminación' : `${total} resultados de solicitudes`,
    total,
    route: 'Autorizaciones',
  });
}

export function syncAulaVirtualRegistro(evento: AulaVirtualEventoAlerta, habilitada: boolean): boolean {
  if (!habilitada) return false;
  const id = String(evento.id || '');
  if (!id) return false;
  const nombre = String(evento.nombreAlumno || evento.email || '').trim() || 'Nuevo usuario';
  return pushAlerta({
    id: `av:registro:${id}`,
    clave: 'alarmas.aula_virtual.registro_nuevo',
    titulo: 'Registro portal aula virtual',
    detalle: evento.alumnoNuevo ? `${nombre} — alumno nuevo` : nombre,
    route: 'Home',
  });
}

export function syncAulaVirtualMatricula(evento: AulaVirtualEventoAlerta, habilitada: boolean): boolean {
  if (!habilitada) return false;
  const id = String(evento.id || '');
  if (!id) return false;
  const nombre = String(evento.nombreAlumno || evento.email || '').trim() || 'Alumno';
  const curso = String(evento.nombrePrograma || evento.idPrograma || '').trim();
  return pushAlerta({
    id: `av:matricula:${id}`,
    clave: 'alarmas.aula_virtual.matricula_nueva',
    titulo: 'Matrícula portal aula virtual',
    detalle: [nombre, curso].filter(Boolean).join(' · ') || 'Nueva matrícula virtual',
    route: 'Home',
  });
}

export function syncAulaVirtualAccesoPorVencer(total: number, habilitada: boolean): boolean {
  return syncAlertaConteo({
    id: 'av:acceso_por_vencer',
    clave: 'alarmas.aula_virtual.acceso_por_vencer',
    titulo: 'Acceso virtual por vencer',
    detalle:
      total === 1 ? '1 acceso sin pago por vencer' : `${total} accesos sin pago por vencer`,
    total,
    route: 'Home',
  });
}

export function syncConsignacionPendiente(row: ConsignacionPendienteRow, habilitada: boolean): boolean {
  if (!habilitada) return false;
  const id = String(row.id || '');
  if (!id || row.estado === 'aprobada' || row.estado === 'rechazada') return false;
  const nombre = String(row.nombreAlumno || '').trim() || (row.numDoc ? `CC ${row.numDoc}` : 'Alumno');
  const curso = String(row.nombreCurso || '').trim();
  const monto = Number(row.montoCop) || 0;
  return pushAlerta({
    id: `av:consignacion:${id}`,
    clave: 'alarmas.aula_virtual.consignacion_pendiente',
    titulo: 'Consignación pendiente',
    detalle: [nombre, curso, monto > 0 ? `$${monto.toLocaleString('es-CO')}` : '']
      .filter(Boolean)
      .join(' · '),
    critico: true,
    route: 'AprobacionConsignacion',
  });
}

export function syncForoMensaje(msg: ForoMensajeAlertaRow, habilitada: boolean): boolean {
  if (!habilitada) return false;
  const id = String(msg.id || '');
  if (!id) return false;
  const autor = String(msg.autorNombre || 'Alumno').trim();
  const curso = String(msg.nombrePrograma || msg.idPrograma || '').trim();
  const texto = String(msg.texto || '').trim().slice(0, 80);
  return pushAlerta({
    id: `av:foro:${id}`,
    clave: 'alarmas.aula_virtual.foro_mensaje',
    titulo: 'Mensaje en foro',
    detalle: [curso, autor, texto].filter(Boolean).join(' · '),
    route: 'Home',
  });
}
