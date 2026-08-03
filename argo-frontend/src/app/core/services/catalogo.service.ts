import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<any[]>>();

  list<T = any>(name: string, opts?: { refresh?: boolean }): Observable<T[]> {
    if (opts?.refresh) this.cache.delete(name);
    if (!this.cache.has(name)) {
      const obs = this.http.get<T[]>(`${environment.apiUrl}/catalogos/${name}`).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cache.set(name, obs);
    }
    return this.cache.get(name) as Observable<T[]>;
  }

  invalidate(name?: string) {
    if (name) this.cache.delete(name);
    else this.cache.clear();
  }

  departamentos(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/catalogos/divipola/departamentos`);
  }

  municipios(codDepto: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiUrl}/catalogos/divipola/municipios/${encodeURIComponent(codDepto)}`,
    );
  }

  buscarMunicipios(q: string, limit = 20, codDepto = ''): Observable<MunicipioDivipola[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (q.trim()) params.set('q', q.trim());
    if (codDepto.trim()) params.set('codDepto', codDepto.trim());
    return this.http.get<MunicipioDivipola[]>(
      `${environment.apiUrl}/catalogos/divipola/buscar?${params}`,
    );
  }

  municipioPorCodigo(codMunicipio: string): Observable<MunicipioDivipola> {
    return this.http.get<MunicipioDivipola>(
      `${environment.apiUrl}/catalogos/divipola/municipio/${encodeURIComponent(codMunicipio)}`,
    );
  }

  buscarColegios(
    codMunicipio: string,
    q = '',
    limit = 40,
    nivel = '',
  ): Observable<ColegioDivipola[]> {
    const params = new URLSearchParams({
      limit: String(limit),
    });
    const mun = String(codMunicipio || '').trim();
    if (mun) params.set('codMunicipio', mun);
    if (q.trim()) params.set('q', q.trim());
    if (nivel.trim()) params.set('nivel', nivel.trim());
    return this.http.get<ColegioDivipola[]>(
      `${environment.apiUrl}/catalogos/colegios/buscar?${params}`,
    );
  }

  buscarTitulaciones(nivel = '', q = '', limit = 80): Observable<TitulacionCatalogo[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (nivel.trim()) params.set('nivel', nivel.trim());
    if (q.trim()) params.set('q', q.trim());
    return this.http.get<TitulacionCatalogo[]>(
      `${environment.apiUrl}/catalogos/titulaciones/buscar?${params}`,
    );
  }

  buscarEstamentosPublicos(codMunicipio = '', q = '', limit = 40): Observable<EstamentoPublico[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (codMunicipio.trim()) params.set('codMunicipio', codMunicipio.trim());
    if (q.trim()) params.set('q', q.trim());
    return this.http.get<EstamentoPublico[]>(
      `${environment.apiUrl}/catalogos/estamentos-publicos/buscar?${params}`,
    );
  }
}

export interface MunicipioDivipola {
  codMunicipio: string;
  nombreMunicipio: string;
  codDepto: string;
  nombreDepto: string;
  label: string;
  labelCompleto?: string;
}

export interface ColegioDivipola {
  codigoEstablecimiento: string;
  nombreEstablecimiento: string;
  codMunicipio: string;
  nombreMunicipio: string;
  nombreDepartamento?: string;
  nivelEducativo?: string | null;
  label: string;
  hint?: string;
}

export interface TitulacionCatalogo {
  codigo: string;
  nivel: string;
  nombre: string;
  label: string;
  hint?: string;
}

export interface EstamentoPublico {
  idEstamento: string;
  nombre: string;
  tipo?: string;
  codMunicipio: string;
  nombreMunicipio?: string;
  label: string;
}
