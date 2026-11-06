import { Injectable, signal, computed } from '@angular/core';

import { isJwtExpired } from './portal-jwt.util';

const TOKEN_KEY = 'argo-aula-token';
const USER_KEY = 'argo-aula-user';

export interface PortalSession {
  email: string;
  numDoc: number;
  nombreCompleto: string;
  empresaId?: string | null;
  empresaNombre?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  private tokenSig = signal<string | null>(this.bootstrapToken());
  private userSig = signal<PortalSession | null>(this.bootstrapUser());

  token = computed(() => this.tokenSig());
  user = computed(() => this.userSig());
  isLoggedIn = computed(() => !!this.tokenSig());

  /** Sesión de pestaña: se pierde al cerrar ventana/pestaña del portal. */
  private storage(): Storage | null {
    try {
      return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
    } catch {
      return null;
    }
  }

  private bootstrapToken(): string | null {
    this.migrateLegacyLocalStorage();
    const t = this.readTokenRaw();
    if (t && isJwtExpired(t)) {
      this.clearStorage();
      return null;
    }
    return t;
  }

  private bootstrapUser(): PortalSession | null {
    if (!this.tokenSig()) return null;
    return this.readUserRaw();
  }

  /** Tokens antiguos en localStorage → sessionStorage (una vez) o se descartan si expiraron. */
  private migrateLegacyLocalStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const legacyToken = localStorage.getItem(TOKEN_KEY);
      const legacyUser = localStorage.getItem(USER_KEY);
      const store = this.storage();
      if (store && legacyToken && !store.getItem(TOKEN_KEY)) {
        if (!isJwtExpired(legacyToken)) {
          store.setItem(TOKEN_KEY, legacyToken);
          if (legacyUser) store.setItem(USER_KEY, legacyUser);
        }
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }

  private readTokenRaw(): string | null {
    try {
      return this.storage()?.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }

  private readUserRaw(): PortalSession | null {
    try {
      const raw = this.storage()?.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as PortalSession) : null;
    } catch {
      return null;
    }
  }

  private clearStorage(): void {
    try {
      this.storage()?.removeItem(TOKEN_KEY);
      this.storage()?.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }

  setSession(
    token: string,
    usuario: { email: string; numDoc: number },
    alumno: { nombreCompleto: string; empresaId?: string | null; empresaNombre?: string | null },
  ) {
    const store = this.storage();
    if (!store) return;
    store.setItem(TOKEN_KEY, token);
    const u: PortalSession = {
      email: usuario.email,
      numDoc: usuario.numDoc,
      nombreCompleto: alumno.nombreCompleto,
      empresaId: alumno.empresaId ?? null,
      empresaNombre: alumno.empresaNombre ?? null,
    };
    store.setItem(USER_KEY, JSON.stringify(u));
    this.tokenSig.set(token);
    this.userSig.set(u);
  }

  updateEmpresa(empresaId: string | null, empresaNombre: string | null) {
    const u = this.userSig();
    if (!u) return;
    const updated: PortalSession = { ...u, empresaId, empresaNombre };
    this.storage()?.setItem(USER_KEY, JSON.stringify(updated));
    this.userSig.set(updated);
  }

  logout() {
    this.clearStorage();
    this.tokenSig.set(null);
    this.userSig.set(null);
  }

  authHeader(): Record<string, string> {
    const t = this.tokenSig();
    if (t && isJwtExpired(t)) {
      this.logout();
      return {};
    }
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
}
