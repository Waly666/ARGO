import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

function puedeGestionarProgramas(rol?: string): boolean {
  const v = String(rol || '').toLowerCase();
  if (v.includes('admin')) return true;
  if (v.includes('rec')) return true;
  if (v === 'cajero' || v.includes('caj')) return true;
  if (v === 'usuario') return true;
  return false;
}

export const programasGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuth()) {
    router.navigateByUrl('/login');
    return false;
  }
  if (!puedeGestionarProgramas(auth.user()?.rol)) {
    router.navigateByUrl('/app/dashboard');
    return false;
  }
  return true;
};
