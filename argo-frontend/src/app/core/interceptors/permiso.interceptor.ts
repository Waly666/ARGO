import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { PermisoAvisoService } from '../services/permiso-aviso.service';

function esErrorSinPermiso(err: unknown): boolean {
  if (!(err instanceof HttpErrorResponse) || err.status !== 403) return false;
  const body = err.error;
  const code = String(body?.code || body?.codigo || '');
  if (code === 'REAUTH_FAILED') return false;
  if (code === 'SIN_PERMISO') return true;

  const msg = String(body?.message || '').toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('sin permiso') ||
    msg.includes('no tiene permiso') ||
    msg.includes('solo administradores') ||
    msg.includes('forbidden')
  );
}

/** Métodos donde el usuario intentó una acción (no carga de pantalla). */
function esAccionUsuario(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PUT' || m === 'PATCH' || m === 'DELETE';
}

/**
 * Diálogo global solo si el usuario intenta mutar sin permiso.
 * Los GET 403 (datos opcionales al entrar a caja/alumnos) no muestran modal:
 * la pantalla sigue y el error se maneja en el componente.
 */
export const permisoInterceptor: HttpInterceptorFn = (req, next) => {
  const aviso = inject(PermisoAvisoService);
  return next(req).pipe(
    catchError((err) => {
      if (esAccionUsuario(req.method) && esErrorSinPermiso(err)) {
        const message = String(err?.error?.message || '').trim();
        void aviso.avisar({
          message:
            message ||
            'No tiene permisos para realizar esta acción.\n\nSolicite acceso a un administrador.',
        });
      }
      return throwError(() => err);
    }),
  );
};
