import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { HorarioOperacionRuntimeService } from '../services/horario-operacion-runtime.service';
import { SedeService } from '../services/sede.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const sedeSvc = inject(SedeService);
  const horarioRt = inject(HorarioOperacionRuntimeService);
  const router = inject(Router);

  const token = auth.token();
  const idSede = sedeSvc.idSede();
  const pantalla = router.url.split('?')[0].slice(0, 500);
  const headers: Record<string, string> = { 'X-ARGO-Cliente': 'escritorio' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (idSede) headers['X-ARGO-Sede'] = idSede;
  if (pantalla.startsWith('/app')) headers['X-ARGO-Pantalla'] = pantalla;

  const authReq = req.clone({ setHeaders: headers });

  return next(authReq).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        horarioRt.procesarHeaders(event.headers);
      }
    }),
    catchError((err) => {
      // 401 por contraseña/MFA incorrectos en reset/restore: no cerrar sesión.
      const code = err?.error?.code;
      const esReauthFallida = code === 'REAUTH_FAILED' || err?.status === 403;
      if (code === 'HORARIO_OPERACION_CERRADO') {
        try {
          sessionStorage.setItem(
            'argo_login_aviso',
            err?.error?.message || 'El sistema no está disponible en este horario.',
          );
        } catch {
          /* ignore */
        }
        auth.logout();
      } else if (code === 'CANAL_CONEXION_DENEGADO') {
        try {
          sessionStorage.setItem(
            'argo_login_aviso',
            err?.error?.message || 'Este usuario no puede conectarse desde el ERP web.',
          );
        } catch {
          /* ignore */
        }
        auth.logout();
      } else if (err?.status === 401 && auth.isAuth() && !esReauthFallida) {
        if (code === 'SESION_REEMPLAZADA') {
          try {
            sessionStorage.setItem(
              'argo_login_aviso',
              err?.error?.message ||
                'Su sesión se cerró porque inició sesión en otro dispositivo o aplicación.',
            );
          } catch {
            /* ignore */
          }
        }
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
