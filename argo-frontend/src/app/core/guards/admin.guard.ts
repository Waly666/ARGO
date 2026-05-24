import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

function esAdmin(rol?: string): boolean {
  const v = String(rol || '').toLowerCase();
  return v === 'admin' || v.includes('admin');
}

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuth()) {
    router.navigateByUrl('/login');
    return false;
  }
  if (!esAdmin(auth.user()?.rol)) {
    router.navigateByUrl('/app/dashboard');
    return false;
  }
  return true;
};
