/** Texto junto al logo en el header (vista previa del editor). */
export function resolverTextoJuntoLogo(
  textoJuntoLogo: string | undefined | null,
  nombreEmpresa: string | undefined | null,
): string {
  const custom = String(textoJuntoLogo ?? '').trim();
  if (custom) return custom;

  const name = String(nombreEmpresa ?? '').trim() || 'Mi institución';
  if (/^cea$/i.test(name) || /centro de enseñanza automovil/i.test(name)) return 'CEA';
  const corto = name.replace(/^centro de enseñanza automovil[ií]stica\s*/i, '').trim();
  if (corto.length <= 12) return corto ? corto.toUpperCase() : 'CEA';
  return 'CEA';
}
