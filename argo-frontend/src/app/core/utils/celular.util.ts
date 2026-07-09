export interface PaisCelular {
  iso: string;
  nombre: string;
  dial: string;
  /** Dígitos del número local (sin indicativo). */
  maxLocal: number;
  minLocal: number;
}

export const PAISES_CELULAR: PaisCelular[] = [
  { iso: 'CO', nombre: 'Colombia', dial: '57', maxLocal: 10, minLocal: 10 },
  { iso: 'EC', nombre: 'Ecuador', dial: '593', maxLocal: 9, minLocal: 9 },
  { iso: 'PE', nombre: 'Perú', dial: '51', maxLocal: 9, minLocal: 9 },
  { iso: 'VE', nombre: 'Venezuela', dial: '58', maxLocal: 10, minLocal: 10 },
  { iso: 'MX', nombre: 'México', dial: '52', maxLocal: 10, minLocal: 10 },
  { iso: 'US', nombre: 'Estados Unidos', dial: '1', maxLocal: 10, minLocal: 10 },
  { iso: 'ES', nombre: 'España', dial: '34', maxLocal: 9, minLocal: 9 },
  { iso: 'PA', nombre: 'Panamá', dial: '507', maxLocal: 8, minLocal: 8 },
  { iso: 'CL', nombre: 'Chile', dial: '56', maxLocal: 9, minLocal: 9 },
  { iso: 'AR', nombre: 'Argentina', dial: '54', maxLocal: 10, minLocal: 10 },
];

export const PAIS_CELULAR_DEFAULT = 'CO';

export type CelularInputModo = 'celular' | 'telefono';

const CO_TELEFONO_MIN = 7;
const CO_TELEFONO_MAX = 10;

export function paisCelularPorIso(iso?: string | null): PaisCelular {
  const key = String(iso || PAIS_CELULAR_DEFAULT).trim().toUpperCase();
  return PAISES_CELULAR.find((p) => p.iso === key) ?? PAISES_CELULAR[0];
}

export function soloDigitosCelular(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/** Parsea valor guardado en BD (10 dígitos CO, +57…, etc.). */
export function parseCelularAlmacenado(raw?: string | null): { iso: string; local: string } {
  const t = String(raw ?? '').trim();
  if (!t) return { iso: PAIS_CELULAR_DEFAULT, local: '' };

  const digits = soloDigitosCelular(t);

  if (t.startsWith('+')) {
    for (const p of [...PAISES_CELULAR].sort((a, b) => b.dial.length - a.dial.length)) {
      if (digits.startsWith(p.dial)) {
        return { iso: p.iso, local: digits.slice(p.dial.length) };
      }
    }
    return { iso: PAIS_CELULAR_DEFAULT, local: digits };
  }

  if (digits.length === 10 && digits.startsWith('3')) {
    return { iso: 'CO', local: digits };
  }

  if (digits.length === 12 && digits.startsWith('57')) {
    return { iso: 'CO', local: digits.slice(2) };
  }

  if (digits.length === 11 && digits.startsWith('57')) {
    return { iso: 'CO', local: digits.slice(2) };
  }

  return { iso: PAIS_CELULAR_DEFAULT, local: digits };
}

export function limitarDigitosLocal(iso: string, local: string): string {
  const p = paisCelularPorIso(iso);
  return soloDigitosCelular(local).slice(0, p.maxLocal);
}

/** Formato visual mientras se digita (Colombia: 300 123 4567). */
export function formatearCelularLocal(iso: string, local: string): string {
  const d = limitarDigitosLocal(iso, local);
  if (!d) return '';
  if (iso === 'CO' && d.length <= 10) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function celularEsVacioAlmacenado(raw?: string | null): boolean {
  return !String(raw ?? '').trim();
}

export function celularToStorage(iso: string, local: string): string {
  const loc = limitarDigitosLocal(iso, local);
  if (!loc) return '';
  const p = paisCelularPorIso(iso);
  if (p.iso === 'CO') return loc;
  return `+${p.dial}${loc}`;
}

export function validarCelularLocal(
  iso: string,
  local: string,
  modo: CelularInputModo = 'celular',
): { valid: boolean; mensaje?: string } {
  const loc = limitarDigitosLocal(iso, local);
  if (!loc) return { valid: true };

  const p = paisCelularPorIso(iso);

  if (p.iso === 'CO' && modo === 'telefono') {
    if (loc.length < CO_TELEFONO_MIN) {
      return {
        valid: false,
        mensaje: `El teléfono colombiano debe tener entre ${CO_TELEFONO_MIN} y ${CO_TELEFONO_MAX} dígitos.`,
      };
    }
    if (loc.length > CO_TELEFONO_MAX) {
      return { valid: false, mensaje: `El teléfono no puede superar ${CO_TELEFONO_MAX} dígitos.` };
    }
    return { valid: true };
  }

  if (p.iso === 'CO') {
    if (loc.length < p.maxLocal) {
      return { valid: false, mensaje: `El celular colombiano debe tener ${p.maxLocal} dígitos.` };
    }
    if (!loc.startsWith('3')) {
      return { valid: false, mensaje: 'El celular colombiano debe empezar por 3 (ej. 300…).' };
    }
    if (!/^3\d{9}$/.test(loc)) {
      return { valid: false, mensaje: 'Número de celular colombiano inválido.' };
    }
    return { valid: true };
  }

  if (loc.length < p.minLocal) {
    return {
      valid: false,
      mensaje: `El número debe tener al menos ${p.minLocal} dígitos para ${p.nombre}.`,
    };
  }
  if (loc.length > p.maxLocal) {
    return {
      valid: false,
      mensaje: `El número no puede superar ${p.maxLocal} dígitos para ${p.nombre}.`,
    };
  }
  return { valid: true };
}

export function mensajeErrorCelularAlmacenado(
  raw?: string | null,
  modo: CelularInputModo = 'celular',
): string | null {
  if (celularEsVacioAlmacenado(raw)) return null;
  const { iso, local } = parseCelularAlmacenado(raw);
  const v = validarCelularLocal(iso, local, modo);
  return v.valid ? null : v.mensaje || (modo === 'telefono' ? 'Teléfono inválido.' : 'Celular inválido.');
}

export function formatearCelularDisplay(raw?: string | null): string {
  if (celularEsVacioAlmacenado(raw)) return '';
  const { iso, local } = parseCelularAlmacenado(raw);
  const p = paisCelularPorIso(iso);
  const fmt = formatearCelularLocal(iso, local);
  if (p.iso === 'CO' && !String(raw).trim().startsWith('+')) return fmt;
  return `+${p.dial} ${fmt}`.trim();
}
