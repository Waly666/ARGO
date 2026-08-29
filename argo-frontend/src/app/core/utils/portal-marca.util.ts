import { DESARROLLADOR_SISTEMA_DEFAULT } from '../constants/portal-site-defaults';

export type PortalMarcaCopyrightInput = {
  textoCopyright?: string | null;
  ocultarMarcaDesarrollador?: boolean;
  textoPieDesarrollador?: string | null;
};

function quitarSufijoDesarrolladorCopyright(texto: string): string {
  return String(texto ?? '')
    .replace(/\s*designed by.*$/i, '')
    .replace(/\s*desarrollado por.*$/i, '')
    .replace(/\s*[·|]\s*desarrollado.*/i, '')
    .trim();
}

/** Copyright del pie de página según marca del constructor de sitio. */
export function resolverCopyrightPie(
  marca: PortalMarcaCopyrightInput | undefined | null,
  landingCopyright: string | undefined | null,
  nombreCea: string | undefined | null,
  desarrolladorDefault = DESARROLLADOR_SISTEMA_DEFAULT,
): string {
  const custom = String(marca?.textoCopyright ?? '').trim();
  const fb = String(landingCopyright ?? '').trim();
  let base = custom || fb;
  if (!base) {
    const year = new Date().getFullYear();
    const nombre = String(nombreCea ?? '').trim() || 'Centro de formación';
    base = `© ${year} ${nombre}. Todos los derechos reservados.`;
  }

  if (marca?.ocultarMarcaDesarrollador !== false) {
    return quitarSufijoDesarrolladorCopyright(base);
  }

  const developer =
    String(marca?.textoPieDesarrollador ?? '').trim() || desarrolladorDefault;
  const sinSufijo = quitarSufijoDesarrolladorCopyright(base);
  return `${sinSufijo} · Desarrollado por ${developer}`;
}

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
