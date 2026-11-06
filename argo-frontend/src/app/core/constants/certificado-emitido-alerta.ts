/** Claves de rol/config que habilitan el banner de certificado recién emitido. */
export const CLAVES_ALERTA_CERTIFICADO_EMITIDO = [
  'alarmas.jornadas.certificado_nuevo',
  'alarmas.alumnos.certificado_emitido',
] as const;

export type ClaveAlertaCertificadoEmitido = (typeof CLAVES_ALERTA_CERTIFICADO_EMITIDO)[number];

/** Quien ve alertas de ingreso (pagos) debe ver también certificados generados (auto o manual). */
export const CLAVE_ALERTA_PAGO_INGRESO = 'alarmas.alumnos.comprobante_ingreso';

export function tieneRolAlertaCertificadoEmitido(tiene: (clave?: string | string[] | null) => boolean): boolean {
  if (CLAVES_ALERTA_CERTIFICADO_EMITIDO.some((k) => tiene(k))) return true;
  return tiene(CLAVE_ALERTA_PAGO_INGRESO);
}

/** Config global activa: clave de certificado o la misma regla que comprobantes de ingreso. */
export function configActivaCertificadoEmitido(
  tiene: (clave?: string | string[] | null) => boolean,
  activa: (clave: string) => boolean,
): boolean {
  for (const k of CLAVES_ALERTA_CERTIFICADO_EMITIDO) {
    if (tiene(k) && activa(k)) return true;
  }
  return tiene(CLAVE_ALERTA_PAGO_INGRESO) && activa(CLAVE_ALERTA_PAGO_INGRESO);
}

/** Clave preferida para intervalo de poll (primera habilitada en rol + config). */
export function clavePollCertificadoEmitido(
  tiene: (clave?: string | string[] | null) => boolean,
  activa: (clave: string) => boolean,
): string {
  for (const k of CLAVES_ALERTA_CERTIFICADO_EMITIDO) {
    if (tiene(k) && activa(k)) return k;
  }
  if (tiene(CLAVE_ALERTA_PAGO_INGRESO) && activa(CLAVE_ALERTA_PAGO_INGRESO)) {
    return CLAVE_ALERTA_PAGO_INGRESO;
  }
  return CLAVES_ALERTA_CERTIFICADO_EMITIDO[0];
}

export function idCertificadoAlerta(cert: Record<string, unknown> | null | undefined): string {
  if (!cert) return '';
  const raw = cert['_id'] ?? cert['id'];
  if (raw == null) return '';
  if (typeof raw === 'object') {
    const o = raw as { $oid?: string; toString?: () => string };
    if (o.$oid) return String(o.$oid);
    if (typeof o.toString === 'function') {
      const s = o.toString();
      if (s && s !== '[object Object]') return s;
    }
  }
  return String(raw);
}
