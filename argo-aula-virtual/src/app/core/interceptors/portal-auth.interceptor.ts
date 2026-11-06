import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { PortalAuthService } from '../portal-auth.service';

const LOGIN_AVISO_KEY = 'argo_portal_login_aviso';

/** Rutas públicas donde 401 no debe cerrar sesión global. */
function esAuthPublico(url: string): boolean {
  return (
    /\/aula-virtual\/auth\//.test(url)
    || /\/aula-virtual\/config/.test(url)
    || /\/pasarela\/config\/publico/.test(url)
  );
}

export const portalAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(PortalAuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.token() && !esAuthPublico(req.url)) {
        try {
          sessionStorage.setItem(
            LOGIN_AVISO_KEY,
            'Tu sesión expiró o ya no es válida. Inicia sesión de nuevo.',
          );
        } catch {
          /* ignore */
        }
        auth.logout();
        const enLogin = router.url.split('?')[0] === '/login';
        if (!enLogin) {
          void router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
        }
      }
      return throwError(() => err);
    }),
  );
};

export { LOGIN_AVISO_KEY };
