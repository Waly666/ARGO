import { FinstruvialServicioSlug } from './finstruvial-servicios.constants';
import { buildPortafolioServiciosDefaults } from './finstruvial-servicios-defaults';
import {
  SERVIAL_PORTAFOLIO_HUB,
  SERVIAL_PORTAFOLIO_MENU_LABEL,
  SERVIAL_SERVICIOS_WIREFRAME,
} from './servial-servicios-wireframe';

const SERVIAL_MENU_LABELS: Record<FinstruvialServicioSlug, string> = {
  aulaVirtual: 'Aula Virtual',
  peridata: 'Asesoría en tránsito',
  capacitacionSensibilizacion: 'Capacitación',
  estudiosDiagnosticosTecnicos: 'Estudios de tránsito',
  herramientasEducativasTecnologicas: 'Soluciones informáticas',
  inventariosViales: 'Inventarios viales',
  planeacionGestionVial: 'Consultoría',
};

const SERVIAL_HUB_ICONS: Record<FinstruvialServicioSlug, string> = {
  aulaVirtual: '💻',
  peridata: '📋',
  capacitacionSensibilizacion: '🎓',
  estudiosDiagnosticosTecnicos: '📊',
  herramientasEducativasTecnologicas: '🖥️',
  inventariosViales: '📍',
  planeacionGestionVial: '🏛️',
};

export const SERVIAL_SERVICIOS_DEFAULTS = buildPortafolioServiciosDefaults({
  wireframe: SERVIAL_SERVICIOS_WIREFRAME,
  menuLabels: SERVIAL_MENU_LABELS,
  hubIcons: SERVIAL_HUB_ICONS,
  menuLabel: SERVIAL_PORTAFOLIO_MENU_LABEL,
  hub: {
    ...SERVIAL_PORTAFOLIO_HUB,
    heroImagenUrl: '',
  },
});
