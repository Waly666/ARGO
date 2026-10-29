import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface DeptoDivipola {
  codDepto: string;
  nombreDepto: string;
}

export interface MunicipioDivipola {
  codMunicipio: string;
  nombreMunicipio: string;
  codDepto: string;
  nombreDepto: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class PortalCatalogService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/aula-virtual/catalogos`;

  tiposDoc(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/tipos-doc`);
  }

  generos(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/generos`);
  }

  identidadesGenero(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/identidades-genero`);
  }

  orientacionesSexuales(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/orientaciones-sexuales`);
  }

  discapacidades(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/discapacidades`);
  }

  multiculturalidad(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/multiculturalidad`);
  }

  actoresViales(): Observable<Record<string, unknown>[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.base}/actores-viales`);
  }

  departamentos(): Observable<DeptoDivipola[]> {
    return this.http.get<DeptoDivipola[]>(`${this.base}/departamentos`);
  }

  municipios(codDepto: string): Observable<MunicipioDivipola[]> {
    return this.http.get<MunicipioDivipola[]>(
      `${this.base}/municipios/${encodeURIComponent(codDepto)}`,
    );
  }

  buscarMunicipios(q: string, limit = 20): Observable<MunicipioDivipola[]> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    return this.http.get<MunicipioDivipola[]>(`${this.base}/municipios-buscar?${params}`);
  }

  municipioPorCodigo(codMunicipio: string): Observable<MunicipioDivipola> {
    return this.http.get<MunicipioDivipola>(
      `${this.base}/municipio/${encodeURIComponent(codMunicipio)}`,
    );
  }

  buscarColegios(
    codMunicipio: string,
    q = '',
    limit = 60,
    nivel = '',
  ): Observable<
    {
      codigoEstablecimiento: string;
      nombreEstablecimiento?: string;
      nombreMunicipio?: string;
      nombreDepartamento?: string;
      label?: string;
      hint?: string;
    }[]
  > {
    const params = new URLSearchParams({ limit: String(limit) });
    const mun = String(codMunicipio || '').trim();
    if (mun) params.set('codMunicipio', mun);
    if (q.trim()) params.set('q', q.trim());
    if (nivel.trim()) params.set('nivel', nivel.trim());
    return this.http.get<
      {
        codigoEstablecimiento: string;
        nombreEstablecimiento?: string;
        nombreMunicipio?: string;
        nombreDepartamento?: string;
        label?: string;
        hint?: string;
      }[]
    >(`${this.base}/colegios/buscar?${params}`);
  }

  buscarTitulaciones(
    nivel = '',
    q = '',
    limit = 80,
  ): Observable<{ codigo: string; nombre?: string; label?: string; hint?: string }[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (nivel.trim()) params.set('nivel', nivel.trim());
    if (q.trim()) params.set('q', q.trim());
    return this.http.get<
      { codigo: string; nombre?: string; label?: string; hint?: string }[]
    >(`${this.base}/titulaciones/buscar?${params}`);
  }

  buscarEstamentosPublicos(
    codMunicipio = '',
    q = '',
    limit = 40,
  ): Observable<{ idEstamento: string; nombre?: string; label?: string }[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (codMunicipio.trim()) params.set('codMunicipio', codMunicipio.trim());
    if (q.trim()) params.set('q', q.trim());
    return this.http.get<{ idEstamento: string; nombre?: string; label?: string }[]>(
      `${this.base}/estamentos-publicos/buscar?${params}`,
    );
  }
}
