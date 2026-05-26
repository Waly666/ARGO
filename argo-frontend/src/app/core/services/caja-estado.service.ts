import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CajaActivaResponse, CajaSesionService } from './caja-sesion.service';

@Injectable({ providedIn: 'root' })
export class CajaEstadoService {
  private cajaSvc = inject(CajaSesionService);

  readonly abierta = signal<boolean | null>(null);
  readonly loading = signal(false);
  readonly sesion = signal<CajaActivaResponse['sesion']>(null);

  async refrescar(): Promise<boolean> {
    this.loading.set(true);
    try {
      const r = await firstValueFrom(this.cajaSvc.activa());
      const ok = !!r.abierta;
      this.abierta.set(ok);
      this.sesion.set(r.sesion ?? null);
      return ok;
    } catch {
      this.abierta.set(false);
      this.sesion.set(null);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  marcarAbierta(): void {
    this.abierta.set(true);
  }

  marcarCerrada(): void {
    this.abierta.set(false);
    this.sesion.set(null);
  }
}
