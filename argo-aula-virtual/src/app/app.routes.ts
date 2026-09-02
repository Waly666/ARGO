import { Routes } from '@angular/router';

import { portalPageGuard } from './core/portal-page.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'tienda',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/cursos/cursos.component').then((m) => m.CursosComponent),
        data: { modo: 'tienda' },
      },
      {
        path: 'cursos',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/cursos/cursos.component').then((m) => m.CursosComponent),
        data: { modo: 'cursos' },
      },
      {
        path: 'cursos/:id',
        loadComponent: () =>
          import('./pages/curso-detalle/curso-detalle.component').then((m) => m.CursoDetalleComponent),
      },
      {
        path: 'aula',
        loadComponent: () => import('./pages/aula/aula.component').then((m) => m.AulaComponent),
      },
      {
        path: 'acerca',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/acerca/acerca.component').then((m) => m.AcercaComponent),
      },
      {
        path: 'fundacion',
        canActivate: [portalPageGuard],
        loadComponent: () =>
          import('./pages/fundacion/fundacion.component').then((m) => m.FundacionComponent),
      },
      {
        path: 'consulta-certificados',
        canActivate: [portalPageGuard],
        loadComponent: () =>
          import('./pages/consulta-certificados/consulta-certificados.component').then(
            (m) => m.ConsultaCertificadosComponent,
          ),
      },
      {
        path: 'cursos-conduccion',
        canActivate: [portalPageGuard],
        loadComponent: () =>
          import('./pages/cursos-conduccion/cursos-conduccion.component').then(
            (m) => m.CursosConduccionComponent,
          ),
      },
      {
        path: 'examen-teorico',
        loadComponent: () =>
          import('./pages/examen-teorico/examen-teorico.component').then((m) => m.ExamenTeoricoComponent),
      },
      {
        path: 'mercancias-peligrosas',
        loadComponent: () =>
          import('./pages/mercancias-peligrosas/mercancias-peligrosas.component').then(
            (m) => m.MercanciasPeligrosasComponent,
          ),
      },
      {
        path: 'trabajo-en-alturas',
        loadComponent: () =>
          import('./pages/trabajo-en-alturas/trabajo-en-alturas.component').then(
            (m) => m.TrabajoEnAlturasComponent,
          ),
      },
      {
        path: 'blog',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/blog/blog.component').then((m) => m.BlogComponent),
      },
      {
        path: 'galeria',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/galeria/galeria.component').then((m) => m.GaleriaComponent),
      },
      {
        path: 'blog/:slug',
        canActivate: [portalPageGuard],
        loadComponent: () =>
          import('./pages/blog-detalle/blog-detalle.component').then((m) => m.BlogDetalleComponent),
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
      },
      {
        path: 'registro/activar',
        loadComponent: () =>
          import('./pages/registro/activar-registro.component').then((m) => m.ActivarRegistroComponent),
      },
      {
        path: 'jornadas-capacitacion',
        loadComponent: () =>
          import('./pages/jornadas-capacitacion/jornadas-capacitacion.component').then(
            (m) => m.JornadasCapacitacionComponent,
          ),
      },
      {
        path: 'evaluacion-jornadas',
        loadComponent: () =>
          import('./pages/evaluacion-jornadas/evaluacion-jornadas.component').then(
            (m) => m.EvaluacionJornadasComponent,
          ),
      },
      {
        path: 'jornadas-capacitacion/activar',
        loadComponent: () =>
          import('./pages/jornadas-capacitacion/activar-jornada.component').then(
            (m) => m.ActivarJornadaComponent,
          ),
      },
      {
        path: 'pqr',
        canActivate: [portalPageGuard],
        loadComponent: () => import('./pages/pqr/pqr.component').then((m) => m.PqrComponent),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./pages/servicios/servicios-hub.component').then((m) => m.ServiciosHubComponent),
      },
      {
        path: 'servicios/:slug',
        loadComponent: () =>
          import('./pages/servicios/servicio-linea.component').then((m) => m.ServicioLineaComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
