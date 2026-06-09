import { Routes } from '@angular/router';

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
        loadComponent: () => import('./pages/cursos/cursos.component').then((m) => m.CursosComponent),
        data: { modo: 'tienda' },
      },
      {
        path: 'cursos',
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
        loadComponent: () => import('./pages/acerca/acerca.component').then((m) => m.AcercaComponent),
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
    ],
  },
  { path: '**', redirectTo: '' },
];
