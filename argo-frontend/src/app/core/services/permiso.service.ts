import { Injectable, computed, signal } from '@angular/core';

const USER_KEY = 'argo_user';

@Injectable({ providedIn: 'root' })
export class PermisoService {
  private _permisos = signal<string[]>(this.readPermisos());

  permisos = computed(() => this._permisos());

  setPermisos(list: string[] | undefined | null): void {
    const p = list?.length ? [...list] : [];
    this._permisos.set(p);
  }

  tiene(clave?: string | string[] | null): boolean {
    if (!clave) return true;
    const keys = Array.isArray(clave) ? clave : [clave];
    const permisos = this._permisos();
    if (!permisos.length) return false;
    if (permisos.includes('*')) return true;
    return keys.some((k) => this.tieneUno(permisos, k));
  }

  private tieneUno(permisos: string[], clave: string): boolean {
    if (permisos.includes(clave)) return true;
    const base = clave.split('.')[0];
    return permisos.includes(base);
  }

  private readPermisos(): string[] {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return [];
      const u = JSON.parse(raw) as { permisos?: string[] };
      return u?.permisos?.length ? [...u.permisos] : [];
    } catch {
      return [];
    }
  }
}
