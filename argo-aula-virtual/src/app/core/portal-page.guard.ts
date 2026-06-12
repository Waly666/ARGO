import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { AulaApiService } from './aula-api.service';
import { clavePaginaPorRuta, paginaActiva } from './portal-site';

export const portalPageGuard: CanActivateFn = (route) => {
  const api = inject(AulaApiService);
  const router = inject(Router);
  const key = clavePaginaPorRuta(route.routeConfig?.path ? `/${route.routeConfig.path}` : '/');
  if (!key || key === 'home' || key === 'aula') return true;

  return api.config().pipe(
    take(1),
    map((cfg) => {
      if (paginaActiva(cfg, key)) return true;
      return router.createUrlTree(['/']);
    }),
  );
};
