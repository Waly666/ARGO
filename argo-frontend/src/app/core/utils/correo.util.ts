/** Correo electrónico: normalización y validación básica. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function correoEsVacio(raw?: string | null): boolean {
  return !String(raw ?? '').trim();
}

export function normalizarCorreo(raw?: string | null): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function validarCorreo(raw?: string | null): { valid: boolean; mensaje?: string } {
  const email = normalizarCorreo(raw);
  if (!email) return { valid: true };
  if (email.length > 254) {
    return { valid: false, mensaje: 'El correo es demasiado largo.' };
  }
  if (/\s/.test(email)) {
    return { valid: false, mensaje: 'El correo no puede contener espacios.' };
  }
  if (!EMAIL_RE.test(email)) {
    return { valid: false, mensaje: 'Ingrese un correo válido (ej. nombre@empresa.com).' };
  }
  return { valid: true };
}

export function mensajeErrorCorreoAlmacenado(raw?: string | null): string | null {
  if (correoEsVacio(raw)) return null;
  const v = validarCorreo(raw);
  return v.valid ? null : v.mensaje || 'Correo inválido.';
}
