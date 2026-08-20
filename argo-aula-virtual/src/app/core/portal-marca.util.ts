import { DEFAULT_CEA_CORTO, DEFAULT_CEA_NOMBRE } from './portal-brand-defaults';

/** Texto junto al logo en el header. Usa `textoJuntoLogo` si está definido; si no, deriva del nombre de la institución. */
export function resolverTextoJuntoLogo(
  textoJuntoLogo: string | undefined | null,
  nombreCea: string | undefined | null,
): string {
  const custom = String(textoJuntoLogo ?? '').trim();
  if (custom) return custom;

  const name = String(nombreCea ?? '').trim() || DEFAULT_CEA_NOMBRE;
  if (/^cea$/i.test(name) || /centro de enseñanza automovil/i.test(name)) return DEFAULT_CEA_CORTO;
  const corto = name.replace(/^centro de enseñanza automovil[ií]stica\s*/i, '').trim();
  if (corto.length <= 12) return corto ? corto.toUpperCase() : DEFAULT_CEA_CORTO;
  return DEFAULT_CEA_CORTO;
}
