import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CajaActivaResponse, CajaSesionService } from './caja-sesion.service';
import { diasCalendarioColombiaDesde } from '../utils/fecha-colombia.util';

@Injectable({ providedIn: 'root' })
export class CajaEstadoService {
  private cajaSvc = inject(CajaSesionService);

  readonly abierta = signal<boolean | null>(null);
  readonly loading = signal(false);
  readonly sesion = signal<CajaActivaResponse['sesion']>(null);
  /** Días desde fechaApertura; 0 si cerrada o abierta hoy. */
  readonly diasSinCerrar = signal(0);
  private ocultaBannerCerrada = signal(false);
  readonly mostrarBannerCerrada = computed(() => !this.ocultaBannerCerrada());

  private ocultaBannerAbiertaDias = signal(false);
  readonly mostrarBannerAbiertaDias = computed(() => !this.ocultaBannerAbiertaDias());

  cerrarBannerCerrada(): void {
    this.ocultaBannerCerrada.set(true);
  }

  cerrarBannerAbiertaDias(): void {
    this.ocultaBannerAbiertaDias.set(true);
  }

  async refrescar(): Promise<boolean> {
    this.loading.set(true);
    try {
      const r = await firstValueFrom(this.cajaSvc.activa());
      const prev = this.abierta();
      const ok = !!r.abierta;
      this.abierta.set(ok);
      this.sesion.set(r.sesion ?? null);
      let dias = ok ? Math.max(0, Number(r.diasSinCerrar) || 0) : 0;
      if (ok && dias === 0 && r.sesion?.fechaApertura) {
        dias = diasCalendarioColombiaDesde(r.sesion.fechaApertura);
      }
      this.diasSinCerrar.set(dias);
      if (ok) {
        this.ocultaBannerCerrada.set(false);
        // Persistente: si sigue abierta con días, la alarma vuelve a mostrarse.
        if (dias >= 1) this.ocultaBannerAbiertaDias.set(false);
      } else {
        this.ocultaBannerAbiertaDias.set(false);
        if (prev === true) this.ocultaBannerCerrada.set(false);
      }
      return ok;
    } catch {
      this.abierta.set(false);
      this.sesion.set(null);
      this.diasSinCerrar.set(0);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  marcarAbierta(): void {
    this.abierta.set(true);
    this.ocultaBannerCerrada.set(false);
  }

  marcarCerrada(): void {
    this.abierta.set(false);
    this.sesion.set(null);
    this.diasSinCerrar.set(0);
    this.ocultaBannerCerrada.set(false);
    this.ocultaBannerAbiertaDias.set(false);
  }
}
