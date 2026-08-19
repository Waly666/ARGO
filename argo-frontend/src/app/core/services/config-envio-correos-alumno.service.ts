import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ConfigEnvioCorreosAlumno {
  enviarCertificados: boolean;
  enviarComprobantesIngreso: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigEnvioCorreosAlumnoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/config/envio-correos-alumno`;

  obtener(): Observable<ConfigEnvioCorreosAlumno> {
    return this.http.get<ConfigEnvioCorreosAlumno>(this.base);
  }

  guardar(cfg: ConfigEnvioCorreosAlumno): Observable<ConfigEnvioCorreosAlumno> {
    return this.http.put<ConfigEnvioCorreosAlumno>(this.base, cfg);
  }
}
