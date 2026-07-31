/** Diferencia de días calendario America/Bogota entre una fecha y hoy. */
export function diasCalendarioColombiaDesde(fechaIso: string | Date): number {
  const desde = partesCalendarioColombia(fechaIso);
  const hoy = partesCalendarioColombia(new Date());
  if (!desde || !hoy) return 0;
  const a = Date.UTC(desde.y, desde.m - 1, desde.d);
  const b = Date.UTC(hoy.y, hoy.m - 1, hoy.d);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function partesCalendarioColombia(d: string | Date): { y: number; m: number; d: number } | null {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dt);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  const y = Number(get('year'));
  const m = Number(get('month'));
  const day = Number(get('day'));
  if (!y || !m || !day) return null;
  return { y, m, d: day };
}
