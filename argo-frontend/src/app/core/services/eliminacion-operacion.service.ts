import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ModuloCrud, etiquetaModulo } from '../utils/crud-permiso.util';
import { AccionPermisoService } from './accion-permiso.service';
import { AutorizacionOperacionService } from './autorizacion-operacion.service';

export type ResultadoEliminacion = 'eliminado' | 'solicitado' | 'cancelado' | 'error';

export interface EliminarOSolicitarOptions {
  modulo: ModuloCrud;
  idEntidad: string;
  resumen: string;
  tituloConfirm?: string;
  mensajeConfirm?: string;
  confirmLabel?: string;
  ejecutar: () => Observable<unknown>;
}

@Injectable({ providedIn: 'root' })
export class EliminacionOperacionService {
  private accionPermiso = inject(AccionPermisoService);
  private autorizacion = inject(AutorizacionOperacionService);
  private confirm = inject(ConfirmDialogService);

  etiquetaBotonEliminar(modulo: ModuloCrud): string {
    return this.accionPermiso.puedeEliminar(modulo) ? 'Eliminar' : 'Solicitar eliminación';
  }

  async ejecutarEliminacionOSolicitar(opts: EliminarOSolicitarOptions): Promise<ResultadoEliminacion> {
    const { modulo, idEntidad, resumen } = opts;
    if (!this.accionPermiso.mostrarAccionEliminar(modulo)) return 'cancelado';

    const directo = this.accionPermiso.puedeEliminar(modulo);
    const titulo =
      opts.tituloConfirm || (directo ? `Eliminar ${etiquetaModulo(modulo).toLowerCase()}` : 'Solicitar eliminación');
    const mensaje =
      opts.mensajeConfirm ||
      (directo
        ? `¿Confirma eliminar ${resumen}? Esta acción no se puede deshacer.`
        : `No tiene permiso para eliminar directamente. Se enviará una solicitud a Configuración para que un administrador autorice la eliminación de: ${resumen}.`);
    const confirmLabel = opts.confirmLabel || (directo ? 'Eliminar' : 'Enviar solicitud');

    const ok = await this.confirm.open({
      title: titulo,
      message: mensaje,
      confirmLabel,
      variant: 'danger',
      icon: 'delete',
    });
    if (!ok) return 'cancelado';

    if (directo) {
      try {
        await firstValueFrom(opts.ejecutar());
        return 'eliminado';
      } catch (e: unknown) {
        const err = e as { error?: { code?: string; message?: string } };
        if (err?.error?.code === 'AUTORIZACION_REQUERIDA') {
          return this.solicitarAutorizacion(modulo, idEntidad, resumen);
        }
        throw e;
      }
    }

    return this.solicitarAutorizacion(modulo, idEntidad, resumen);
  }

  private async solicitarAutorizacion(
    modulo: ModuloCrud,
    idEntidad: string,
    resumen: string,
  ): Promise<ResultadoEliminacion> {
    const motivo = await this.confirm.openPrompt({
      title: 'Motivo de la solicitud',
      message: 'Indique brevemente por qué debe eliminarse este registro (opcional).',
      inputLabel: 'Motivo',
      confirmLabel: 'Enviar solicitud',
      variant: 'warn',
      icon: 'warning',
    });
    if (motivo === null) return 'cancelado';

    try {
      await firstValueFrom(
        this.autorizacion.solicitar({
          modulo,
          idEntidad,
          resumen,
          motivo: motivo.trim() || null,
        }),
      );
      await this.confirm.open({
        title: 'Solicitud enviada',
        message:
          'Su solicitud quedó pendiente. Un administrador la revisará en Configuración → Autorizaciones pendientes.',
        variant: 'success',
        icon: 'check',
        hideCancel: true,
        confirmLabel: 'Entendido',
      });
      return 'solicitado';
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      await this.confirm.open({
        title: 'No se pudo enviar la solicitud',
        message: err?.error?.message || 'Error al registrar la solicitud.',
        variant: 'warn',
        icon: 'warning',
        hideCancel: true,
      });
      return 'error';
    }
  }
}
