/** Cápsulas, etiquetas y mensajes del módulo Jornadas de Capacitación. */

export type JorMsgTipo = 'ok' | 'error' | 'info' | 'warn';

export function tituloJorMsg(tipo: JorMsgTipo): string {
  switch (tipo) {
    case 'ok':
      return 'Listo';
    case 'error':
      return 'Acción no completada';
    case 'warn':
      return 'Atención';
    default:
      return 'Información';
  }
}

export function iconoJorMsg(tipo: JorMsgTipo): string {
  switch (tipo) {
    case 'ok':
      return '✓';
    case 'error':
      return '✕';
    case 'warn':
      return '!';
    default:
      return 'i';
  }
}

/** Sufijo de color (calendario, chips sin clase base). */
export function capEstadoJornadaColor(estado?: string | null): string {
  const e = String(estado ?? '').toUpperCase();
  if (e === 'EN PROCESO') return 'cap-emerald';
  if (e === 'FINALIZADO') return 'cap-slate';
  if (e === 'INACTIVO') return 'cap-amber';
  return 'cap-slate';
}

export function capEstadoJornada(estado?: string | null): string {
  return `cap ${capEstadoJornadaColor(estado)}`;
}

export function capEstadoClase(estado?: string | null): string {
  const e = String(estado ?? '').toUpperCase();
  if (e === 'EN PROCESO') return 'cap cap-emerald cap-sm cap-text';
  if (e === 'FINALIZADO') return 'cap cap-slate cap-sm cap-text';
  return 'cap cap-indigo cap-sm cap-text';
}

export function capUbicacionClase(ubicacion?: string | null): string {
  const u = String(ubicacion ?? '').toLowerCase();
  if (u === 'carpa') return 'cap cap-orange cap-sm cap-text';
  if (u === 'domo') return 'cap cap-purple cap-sm cap-text';
  if (u === 'empresa') return 'cap cap-teal cap-sm cap-text';
  if (u === 'colegio' || u === 'auditorio') return 'cap cap-blue cap-sm cap-text';
  return 'cap cap-cyan cap-sm cap-text';
}

export function capDeteGeorefe(v?: string | null): string {
  switch (v) {
    case 'MAPA':
      return 'cap cap-blue cap-sm cap-text';
    case 'DISPOSITIVO_MOVIL':
      return 'cap cap-cyan cap-sm cap-text';
    case 'MANUAL':
      return 'cap cap-violet cap-sm cap-text';
    default:
      return 'cap cap-slate cap-sm cap-text';
  }
}

export function capCodContrato(v?: string | null): string {
  return v?.trim() ? 'cap cap-indigo cap-mono cap-sm' : 'cap cap-slate cap-sm';
}

export function capCliente(_v?: string | null): string {
  return 'cap cap-text cap-sm';
}

export function capMunicipioJor(v?: string | null): string {
  return v?.trim() ? 'cap cap-teal cap-sm cap-text' : 'cap cap-slate cap-sm';
}

export function capFechaJor(_v?: string | null): string {
  return 'cap cap-slate cap-sm cap-mono';
}

export function capHoraJor(v?: string | null): string {
  return v && v !== '—' ? 'cap cap-cyan cap-sm cap-mono' : 'cap cap-slate cap-sm';
}

export function capMetaNum(v?: number | null): string {
  if (v == null || Number.isNaN(v)) return 'cap cap-slate cap-sm';
  return 'cap cap-cyan cap-sm cap-mono';
}

export function capSesCert(v?: number | null): string {
  if (v == null) return 'cap cap-slate cap-sm';
  return 'cap cap-violet cap-sm cap-mono';
}

export function capHorasCert(v?: string | number | null): string {
  return v != null && String(v).trim() ? 'cap cap-violet cap-sm' : 'cap cap-slate cap-sm';
}

export function capCertCodigo(_v?: string | null): string {
  return 'cap cap-indigo cap-mono cap-sm';
}

export function capDocAsis(_v?: string | number | null): string {
  return 'cap cap-indigo cap-mono cap-sm';
}

export function capAlumnoNombre(_v?: string | null): string {
  return 'cap cap-text cap-sm';
}

export function capGenerado(v?: boolean): string {
  return v ? 'cap cap-emerald cap-sm cap-text' : 'cap cap-amber cap-sm cap-text';
}

export function etiquetaGenerado(v?: boolean): string {
  return v ? 'Programadas' : 'Pendiente';
}

export function capPrograma(_v?: string | null): string {
  return 'cap cap-blue cap-sm cap-text';
}

export function capInstructor(v?: string | null): string {
  return v?.trim() ? 'cap cap-orange cap-sm cap-text' : 'cap cap-slate cap-sm';
}

export function capContratoLabel(_v?: string | null): string {
  return 'cap cap-indigo cap-sm cap-text';
}

/** Opciones HH:mm cada `intervaloMin` minutos (00:00 … 23:45). */
export function listaOpcionesHora(intervaloMin = 15): string[] {
  const paso = Math.max(1, Math.min(60, Math.floor(intervaloMin)));
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += paso) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    out.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return out;
}

/** ISO/fecha → HH:mm para inputs de hora. */
export function isoAHoraInput(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function validarHoraInput(val?: string | null): boolean {
  if (!val || !String(val).trim()) return true;
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(val).trim());
}
