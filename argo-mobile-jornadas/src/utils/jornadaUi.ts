export function ymdLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtFecha(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function isoAHoraInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Hora real HH:mm:ss (cronómetro / operación en campo). */
export function isoAHoraCompleta(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function validarHoraInput(h: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(h.trim());
}

export function labelEstadoClase(estado?: string): string {
  const e = String(estado || '').toUpperCase();
  if (e === 'EN PROCESO') return 'En curso';
  if (e === 'FINALIZADO') return 'Terminada';
  if (e === 'PROGRAMADA') return 'Programada';
  return estado || '—';
}

/** Formato HH:MM:SS a partir de milisegundos (cronómetro de clase). */
export function formatCronometro(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Duración entre inicio y fin (o ahora si sigue en curso). */
export function msDuracionClase(
  horaInicio?: string | null,
  horaFin?: string | null,
  ahoraMs: number = Date.now(),
): number | null {
  if (!horaInicio) return null;
  const ini = new Date(horaInicio).getTime();
  if (Number.isNaN(ini)) return null;
  let fin = ahoraMs;
  if (horaFin) {
    const f = new Date(horaFin).getTime();
    if (!Number.isNaN(f)) fin = f;
  }
  return Math.max(0, fin - ini);
}

export function labelEstadoJornada(estado?: string): string {
  const e = String(estado || '').toUpperCase();
  if (e === 'EN PROCESO') return 'EN PROCESO';
  if (e === 'FINALIZADO') return 'FINALIZADO';
  if (e === 'INACTIVO') return 'INACTIVO';
  return estado || '—';
}
