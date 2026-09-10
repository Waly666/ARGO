import { PortalEnlaceRelacionado } from '../portal-enlace-relacionado.util';

export const FINSTRUVIAL_ENLACES_TITULO = 'Formación relacionada';

export const FINSTRUVIAL_ENLACES_MANEJO_DEFENSIVO: PortalEnlaceRelacionado[] = [
  {
    texto: '¿Necesitas formación complementaria?',
    etiqueta: 'Ver cursos disponibles',
    url: '/cursos',
  },
  {
    texto: '¿Buscas primeros auxilios?',
    etiqueta: 'Curso de Primeros Auxilios',
    url: '/curso-primeros-auxilios',
  },
  {
    texto: '¿Prefieres formación virtual?',
    etiqueta: 'Acceder al Aula Virtual',
    url: '/servicios/aula-virtual',
  },
];

export const FINSTRUVIAL_ENLACES_PRIMEROS_AUXILIOS: PortalEnlaceRelacionado[] = [
  {
    texto: '¿Necesitas formación para conductores?',
    etiqueta: 'Curso de Manejo Defensivo',
    url: '/curso-manejo-defensivo',
  },
  {
    texto: '¿Prefieres formación virtual?',
    etiqueta: 'Acceder al Aula Virtual',
    url: '/servicios/aula-virtual',
  },
];
