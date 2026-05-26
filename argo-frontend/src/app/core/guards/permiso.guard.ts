import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PermisoService } from '../services/permiso.service';

export const permisoGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const permisos = inject(PermisoService);
  const router = inject(Router);

  if (!auth.isAuth()) {
    router.navigateByUrl('/login');
    return false;
  }

  const clave = route.data['permiso'] as string | string[] | undefined;
  if (!clave) return true;

  if (!permisos.tiene(clave)) {
    router.navigateByUrl('/app/dashboard');
    return false;
  }
  return true;
};

/** Compatibilidad con rutas que usaban programasGuard */
export const programasGuard = permisoGuard;
