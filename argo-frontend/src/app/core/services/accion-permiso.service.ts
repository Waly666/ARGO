import { Injectable, computed, inject } from '@angular/core';

import {
  AccionCrud,
  ModuloCrud,
  puedeAutorizarOperaciones,
  tieneAccionModulo,
} from '../utils/crud-permiso.util';
import { PermisoService } from './permiso.service';

@Injectable({ providedIn: 'root' })
export class AccionPermisoService {
  private permisos = inject(PermisoService);

  private lista = computed(() => this.permisos.permisos());

  tiene(modulo: ModuloCrud, accion: AccionCrud): boolean {
    return tieneAccionModulo(this.lista(), modulo, accion);
  }

  puedeAutorizar(): boolean {
    return puedeAutorizarOperaciones(this.lista());
  }

  puedeEliminar(modulo: ModuloCrud): boolean {
    return this.tiene(modulo, 'eliminar');
  }

  puedeSolicitarEliminacion(modulo: ModuloCrud): boolean {
    if (this.puedeEliminar(modulo)) return false;
    return this.tiene(modulo, 'ver') || this.tiene(modulo, 'editar');
  }

  mostrarAccionEliminar(modulo: ModuloCrud): boolean {
    return this.puedeEliminar(modulo) || this.puedeSolicitarEliminacion(modulo);
  }
}
