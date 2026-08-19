import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ConfigGestoresEmpresas {
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigGestoresEmpresasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/gestores-empresas`;

  obtener(): Observable<ConfigGestoresEmpresas> {
    return this.http.get<ConfigGestoresEmpresas>(this.base);
  }

  guardar(cfg: ConfigGestoresEmpresas): Observable<ConfigGestoresEmpresas> {
    return this.http.put<ConfigGestoresEmpresas>(this.base, cfg);
  }
}
