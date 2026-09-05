import { PortalTemaLike, resolvePortalHeroEstilo } from './portal-theme-css.util';
import { PortalFinstruvialServiciosConfig } from './constants/finstruvial-servicio-landing.types';
import {
  FINSTRUVIAL_SERVICIOS_DEFAULTS,
  mergeFinstruvialServicios,
  PortafolioServiciosWireframe,
} from './constants/finstruvial-servicios-defaults';
import { FINSTRUVIAL_SERVICIOS_WIREFRAME } from './constants/finstruvial-servicios-wireframe';
import { SERVIAL_SERVICIOS_DEFAULTS } from './constants/servial-servicios-defaults';
import { SERVIAL_SERVICIOS_WIREFRAME } from './constants/servial-servicios-wireframe';
import { servialPortafolioMediaOnly } from './constants/servial-portafolio-media.util';

export function portafolioServiciosEsServial(tema?: PortalTemaLike | null): boolean {
  return resolvePortalHeroEstilo(tema) === 'servial-mesh';
}

export function portafolioServiciosDefaultsForTema(
  tema?: PortalTemaLike | null,
): PortalFinstruvialServiciosConfig {
  return portafolioServiciosEsServial(tema) ? SERVIAL_SERVICIOS_DEFAULTS : FINSTRUVIAL_SERVICIOS_DEFAULTS;
}

export function portafolioServiciosWireframeForTema(
  tema?: PortalTemaLike | null,
): PortafolioServiciosWireframe {
  return portafolioServiciosEsServial(tema) ? SERVIAL_SERVICIOS_WIREFRAME : FINSTRUVIAL_SERVICIOS_WIREFRAME;
}

export function mergePortafolioServicios(
  raw?: Partial<PortalFinstruvialServiciosConfig> | null,
  tema?: PortalTemaLike | null,
): PortalFinstruvialServiciosConfig {
  const base = portafolioServiciosDefaultsForTema(tema);
  const wireframe = portafolioServiciosWireframeForTema(tema);
  const src = portafolioServiciosEsServial(tema) ? servialPortafolioMediaOnly(raw) : raw;
  return mergeFinstruvialServicios(src, base, wireframe);
}
