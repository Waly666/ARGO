import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ItemCatalogoInspeccion {
  id: string;
  label: string;
}

export interface CatalogosInspeccionVehiculo {
  itemsEstGral: ItemCatalogoInspeccion[];
  aspecto1: ItemCatalogoInspeccion[];
  aspecto2: ItemCatalogoInspeccion[];
  adaptaciones: ItemCatalogoInspeccion[];
}

export interface FormatoInspeccionPorClase {
  idClase: string;
  idItemsEstGral: string[];
  idAspecto1: string[];
  idAspecto2: string[];
  idAdaptaciones: string[];
}

export type SeccionFormatoInspeccion = 'idItemsEstGral' | 'idAspecto1' | 'idAspecto2' | 'idAdaptaciones';

export interface ConfigFormatoInspeccionVehiculos {
  clave?: string;
  catalogos: CatalogosInspeccionVehiculo;
  requisitosPorClase: FormatoInspeccionPorClase[];
  prefijoConsecutivoInspeccion?: string;
  consecutivoInspeccion?: number;
  proximoConsecutivoInspeccion?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigFormatoInspeccionVehiculosService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/formato-inspeccion-vehiculos`;

  obtener(): Observable<ConfigFormatoInspeccionVehiculos> {
    return this.http.get<ConfigFormatoInspeccionVehiculos>(this.base);
  }

  guardar(
    data: Pick<
      ConfigFormatoInspeccionVehiculos,
      'requisitosPorClase' | 'prefijoConsecutivoInspeccion' | 'consecutivoInspeccion'
    >,
  ): Observable<ConfigFormatoInspeccionVehiculos> {
    return this.http.put<ConfigFormatoInspeccionVehiculos>(this.base, data);
  }
}
