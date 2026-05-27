import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PermisoService } from './permiso.service';
import { AlarmaService } from './alarma.service';

export interface AuthEmpleadoResumen {
  idEmpleado: number;
  nombreCompleto: string;
  numeroDocumento?: string;
  idUsuario?: string;
}

export interface AuthUser {
  _id: string;
  username: string;
  nombres?: string;
  apellidos?: string;
  rol?: string;
  rolNombre?: string;
  permisos?: string[];
  alarmas?: string[];
  email?: string;
  idEmpleado?: number;
  empleado?: AuthEmpleadoResumen;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface VerificarAdminResponse {
  ok: boolean;
  username: string;
  nombreAutoriza: string;
  idUsuario: string;
}

const TOKEN_KEY = 'argo_token';
const USER_KEY = 'argo_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private permisoSvc = inject(PermisoService);
  private alarmaSvc = inject(AlarmaService);

  private _token = signal<string | null>(this.read(TOKEN_KEY));
  private _user = signal<AuthUser | null>(this.readJson<AuthUser>(USER_KEY));

  token = computed(() => this._token());
  user = computed(() => this._user());
  isAuth = computed(() => !!this._token());
  isAdmin = computed(() => {
    const p = this._user()?.permisos;
    if (p?.includes('*')) return true;
    const r = String(this._user()?.rol || '').toLowerCase();
    return r === 'admin' || r.includes('admin');
  });

  tienePermiso(clave: string | string[]): boolean {
    return this.permisoSvc.tiene(clave);
  }

  refreshMe(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
        this.permisoSvc.setPermisos(user.permisos);
        this.alarmaSvc.setAlarmas(user.alarmas);
      }),
    );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          this._token.set(res.token);
          this._user.set(res.user);
          this.permisoSvc.setPermisos(res.user.permisos);
          this.alarmaSvc.setAlarmas(res.user.alarmas);
        }),
      );
  }

  /** Valida credenciales de admin sin cerrar la sesión del cajero. */
  verificarAdmin(username: string, password: string): Observable<VerificarAdminResponse> {
    return this.http.post<VerificarAdminResponse>(`${environment.apiUrl}/auth/verificar-admin`, {
      username,
      password,
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._user.set(null);
    this.permisoSvc.setPermisos([]);
    this.alarmaSvc.setAlarmas([]);
    this.router.navigateByUrl('/login');
  }

  private read(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  private readJson<T>(key: string): T | null {
    const raw = this.read(key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
}
