import { Injectable, inject } from '@angular/core';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

const MSG_DEFAULT =
  'No tiene permisos para realizar esta acción.\n\nSolicite acceso a un administrador o revise Configuración → Roles y permisos.';

/**
 * Diálogo global cuando el usuario intenta algo sin permiso (ruta o API).
 * Evita apilar varios cuadros si hay varias peticiones 403 a la vez.
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

  /** Aviso al bloquear una ruta del menú / URL. */
  avisarRuta(): void {
    void this.avisar({
      title: 'Sin permiso',
      message:
        'No tiene permiso para acceder a esta sección.\n\nSolicite acceso a un administrador o revise Configuración → Roles y permisos.',
    });
  }
}
