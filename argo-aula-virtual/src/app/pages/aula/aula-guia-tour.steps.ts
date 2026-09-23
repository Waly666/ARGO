export type AulaGuiaPanelKey =
  | 'tablero'
  | 'cursos'
  | 'presenciales'
  | 'puntajes'
  | 'certificados'
  | 'perfil'
  | 'foro';

export interface AulaGuiaTourStep {
  title: string;
  body: string;
  /** Atributo data-aula-tour del elemento a resaltar; vacío = modal centrado. */
  target?: string;
  panel?: AulaGuiaPanelKey;
}

export const AULA_GUIA_TOUR_STEPS: AulaGuiaTourStep[] = [
  {
    title: 'Bienvenido al aula virtual',
    body: 'Esta guía rápida le muestra dónde encontrar sus cursos, puntajes y certificados. Use Siguiente para continuar.',
  },
  {
    title: 'Menú principal',
    body: 'Desde aquí cambia entre tablero, cursos, puntajes, certificados, foro y perfil.',
    target: 'nav',
    panel: 'tablero',
  },
  {
    title: 'Resumen de avance',
    body: 'Estas tarjetas muestran cuántos cursos tiene inscritos, en progreso, completados y certificados.',
    target: 'stats',
    panel: 'tablero',
  },
  {
    title: 'Continuar estudiando',
    body: 'Aquí aparecen los cursos para retomar donde lo dejó. Es su acceso directo al estudio.',
    target: 'continuar',
    panel: 'tablero',
  },
  {
    title: 'Abrir un curso',
    body: 'Haga clic en Continuar o en el nombre del curso para ver clases, videos y evaluaciones.',
    target: 'curso-fila',
    panel: 'tablero',
  },
  {
    title: 'Todos sus cursos',
    body: 'En Tus cursos verá el listado completo y podrá entrar a cada programa virtual.',
    target: 'nav-cursos',
    panel: 'tablero',
  },
  {
    title: 'Certificados',
    body: 'Cuando el centro habilite su certificado, podrá descargarlo desde esta sección.',
    target: 'nav-certificados',
    panel: 'tablero',
  },
  {
    title: 'Listo',
    body: 'Puede repetir esta guía cuando quiera con el botón «Guía del aula» en el tablero.',
    panel: 'tablero',
  },
];

export const AULA_GUIA_TOUR_STORAGE_KEY = 'argo.aula.guia-tour.v1.completed';
