import { Injectable, inject } from '@angular/core';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

const MSG_DEFAULT =
  'No tiene permisos para realizar esta acción.\n\nSolicite acceso a un administrador o revise Configuración → Roles y permisos.';

/**
 * Diálogo cuando el usuario intenta una acción (POST/PUT/…) sin permiso.
 * No se usa al navegar ni ante GET 403 de datos opcionales.
 */
@Injectable({ providedIn: 'root' })
export class PermisoAvisoService {
  private confirm = inject(ConfirmDialogService);
  private abierto = false;
  private ultimoMs = 0;

  async avisar(opts?: { title?: string; message?: string }): Promise<void> {
    const now = Date.now();
    if (this.abierto || now - this.ultimoMs < 900) return;
    if (this.confirm.state()) return;

    this.abierto = true;
    this.ultimoMs = now;
    try {
      await this.confirm.open({
        title: opts?.title || 'Sin permiso',
        message: String(opts?.message || '').trim() || MSG_DEFAULT,
        variant: 'warn',
        icon: 'warning',
        confirmLabel: 'Entendido',
        hideCancel: true,
      });
    } finally {
      this.abierto = false;
    }
  }
}
