import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export type DestinoCorreoReferidor = 'ninguno' | 'alumno' | 'referidor' | 'ambos';

export interface ReglasCorreoReferidor {
  comprobanteIngreso: DestinoCorreoReferidor;
  certificado: DestinoCorreoReferidor;
}

export interface ConfigEnvioCorreosAlumno {
  enviarCertificados: boolean;
  enviarComprobantesIngreso: boolean;
  referidorComercial: {
    gestor: ReglasCorreoReferidor;
    empresa: ReglasCorreoReferidor;
  };
}

export const DESTINOS_CORREO_REFERIDOR: Array<{ value: DestinoCorreoReferidor; label: string }> = [
  { value: 'ninguno', label: 'No enviar' },
  { value: 'alumno', label: 'Solo al alumno' },
  { value: 'referidor', label: 'Solo al gestor / empresa' },
  { value: 'ambos', label: 'Al alumno y al gestor / empresa' },
];

export const CONFIG_ENVIO_CORREOS_DEFAULT: ConfigEnvioCorreosAlumno = {
  enviarCertificados: true,
  enviarComprobantesIngreso: true,
  referidorComercial: {
    gestor: { comprobanteIngreso: 'ninguno', certificado: 'alumno' },
    empresa: { comprobanteIngreso: 'ninguno', certificado: 'alumno' },
  },
};

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
