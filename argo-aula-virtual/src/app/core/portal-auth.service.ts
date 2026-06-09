import { Injectable, signal, computed } from '@angular/core';

const TOKEN_KEY = 'argo-aula-token';
const USER_KEY = 'argo-aula-user';

export interface PortalSession {
  email: string;
  numDoc: number;
  nombreCompleto: string;
}

@Injectable({ providedIn: 'root' })
export class PortalAuthService {
  private tokenSig = signal<string | null>(this.readToken());
  private userSig = signal<PortalSession | null>(this.readUser());

  token = computed(() => this.tokenSig());
  user = computed(() => this.userSig());
  isLoggedIn = computed(() => !!this.tokenSig());

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): PortalSession | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as PortalSession) : null;
    } catch {
      return null;
    }
  }

  setSession(token: string, usuario: { email: string; numDoc: number }, alumno: { nombreCompleto: string }) {
    localStorage.setItem(TOKEN_KEY, token);
    const u: PortalSession = {
      email: usuario.email,
      numDoc: usuario.numDoc,
      nombreCompleto: alumno.nombreCompleto,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    this.tokenSig.set(token);
    this.userSig.set(u);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSig.set(null);
    this.userSig.set(null);
  }

  authHeader(): Record<string, string> {
    const t = this.tokenSig();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
}
