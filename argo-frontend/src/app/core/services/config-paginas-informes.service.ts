import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface MargenesPaginaInforme {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PaginaInforme {
  key: string;
  label: string;
  grupoId: string;
  grupoLabel: string;
  sizeMode: 'preset' | 'fixed' | 'termico' | 'layout' | string;
  size: string;
  orientation: '' | 'portrait' | 'landscape' | string;
  margins: MargenesPaginaInforme;
  hint?: string;
  sizeEditable?: boolean;
  orientationEditable?: boolean;
}

export interface PaginasInformesCatalogos {
  grupos: {
    id: string;
    label: string;
    informes: {
      key: string;
      label: string;
      sizeMode: string;
      size: string;
      orientation?: string;
      defaultMargins: MargenesPaginaInforme;
      hint?: string;
    }[];
  }[];
  sizePresets: { id: string; label: string }[];
  orientaciones: { id: string; label: string }[];
}

@Injectable({ providedIn: 'root' })
export class ConfigPaginasInformesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/paginas-informes`;
  private cache$: Observable<{ paginas: PaginaInforme[] }> | null = null;
  private mapa = new Map<string, PaginaInforme>();

  catalogos(): Observable<PaginasInformesCatalogos> {
    return this.http.get<PaginasInformesCatalogos>(`${this.base}/catalogos`);
  }

  obtener(force = false): Observable<{ paginas: PaginaInforme[] }> {
    if (!force && this.cache$) return this.cache$;
    this.cache$ = this.http.get<{ paginas: PaginaInforme[] }>(this.base).pipe(
      tap((r) => {
        this.mapa.clear();
        for (const p of r.paginas || []) this.mapa.set(p.key, p);
      }),
      shareReplay(1),
    );
    return this.cache$;
  }

  guardar(paginas: PaginaInforme[]): Observable<{ paginas: PaginaInforme[] }> {
    return this.http.put<{ paginas: PaginaInforme[] }>(this.base, { paginas }).pipe(
      tap((r) => {
        this.mapa.clear();
        for (const p of r.paginas || []) this.mapa.set(p.key, p);
        this.cache$ = of(r).pipe(shareReplay(1));
      }),
    );
  }

  /** CSS `@page { … }` para un informe (usa caché si ya se cargó). */
  atPageCss(key: string, sizeOverride?: string): string {
    const p = this.mapa.get(key);
    const m = p?.margins || { top: 12, right: 12, bottom: 12, left: 12 };
    const margin = `${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm`;
    if (sizeOverride) {
      return `@page { size: ${sizeOverride}; margin: ${margin}; }`.replace(/\s+/g, ' ').trim();
    }
    const sizeMap: Record<string, string> = {
      A4: 'A4',
      letter: 'letter',
      legal: 'legal',
      media_carta: '140mm 216mm',
      termico_80: '80mm auto',
      termico_58: '58mm auto',
      etiqueta_qr: '52mm 32mm',
      cert_horizontal: '297mm 210mm',
      cert_vertical: '210mm 297mm',
    };
    const sizeId = p?.size || 'A4';
    let size = sizeMap[sizeId] || sizeId;
    if (['A4', 'letter', 'legal'].includes(sizeId) && p?.orientation) {
      size = `${size} ${p.orientation}`;
    }
    return `@page { size: ${size}; margin: ${margin}; }`.replace(/\s+/g, ' ').trim();
  }

  /** Carga config si hace falta y resuelve el CSS. */
  ensureAndAtPageCss(key: string, sizeOverride?: string): Observable<string> {
    return new Observable((sub) => {
      this.obtener().subscribe({
        next: () => {
          sub.next(this.atPageCss(key, sizeOverride));
          sub.complete();
        },
        error: () => {
          sub.next(this.atPageCss(key, sizeOverride));
          sub.complete();
        },
      });
    });
  }
}
