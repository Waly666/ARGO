import type {
  PortalAsistenteConfig,
  PortalAsistenteViewConfig,
  PortalPaginaKey,
} from '../api/types';

/** Config lista para el asistente flotante en una pantalla concreta. */
export function asistenteVistaParaPagina(
  asistente: PortalAsistenteConfig | undefined | null,
  pagina: PortalPaginaKey,
): PortalAsistenteViewConfig | null {
  if (!asistente) return null;
  const page = asistente.paginas?.[pagina];
  if (!page?.activo || !page.texto?.trim()) return null;

  return {
    asistenteActivo: true,
    asistenteTexto: page.texto.trim(),
    asistenteVideoUrl: asistente.videoUrl,
    asistenteVideoUrlAbsoluta: asistente.videoUrlAbsoluta,
  };
}
