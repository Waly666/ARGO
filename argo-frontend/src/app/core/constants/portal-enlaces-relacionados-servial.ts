import { PortalEnlaceRelacionado } from '../portal-enlace-relacionado.util';

export const CC_LICENCIAS_URL = 'https://servial.com.co/licencias-de-conduccion/';

export const SERVIAL_ENLACES_TITULO = 'Formación relacionada en SERVIAL';

export const SERVIAL_ENLACES_MANEJO_DEFENSIVO: PortalEnlaceRelacionado[] = [
  {
    texto: '¿Necesitas realizar la capacitación para tu licencia?',
    etiqueta: 'Conoce nuestros cursos de conducción en Villavicencio',
    url: '/cursos-conduccion',
  },
  {
    texto: '¿Quieres conocer el proceso para obtener tu licencia?',
    etiqueta: 'Consulta los requisitos para la licencia de conducción',
    url: CC_LICENCIAS_URL,
  },
  {
    texto: '¿Prefieres formación virtual?',
    etiqueta: 'Explorar el Aula Virtual',
    url: '/servicios/aula-virtual',
  },
];

export const SERVIAL_ENLACES_PRIMEROS_AUXILIOS: PortalEnlaceRelacionado[] = [
  {
    texto: '¿Necesitas formación para conductores?',
    etiqueta: 'Cursos de conducción en Villavicencio',
    url: '/cursos-conduccion',
  },
  {
    texto: '¿Prefieres formación virtual?',
    etiqueta: 'Acceder al Aula Virtual',
    url: '/servicios/aula-virtual',
  },
];
