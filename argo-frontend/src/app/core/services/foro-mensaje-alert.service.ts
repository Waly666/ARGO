import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { ForoAdminService } from './foro-admin.service';
import { environment } from '../../../environments/environment';

export interface ForoMensajeAlerta {
  id: string;
  idPrograma: string;
  nombrePrograma: string;
  autorNombre: string;
  texto: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ForoMensajeAlertService {
  private auth = inject(AuthService);
  private router = inject(Router);
  private foroAdmin = inject(ForoAdminService);

  private socket: Socket | null = null;
  private vistos = new Set<string>();
  private activo = false;

  private readonly _alertas = signal<ForoMensajeAlerta[]>([]);
  readonly alertas = this._alertas.asReadonly();

  conectar() {
    if (this.activo && this.socket?.connected) return;
    const token = this.auth.token();
    if (!token) return;

    this.activo = true;

    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    const base = environment.apiUrl.replace('/api', '') || window.location.origin;

    this.socket = io(`${base}/foro`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    this.socket.on('foro-nuevo-mensaje', (msg: ForoMensajeAlerta) => this.recibir(msg));
    this.socket.on('disconnect', () => undefined);
  }

  desconectar() {
    this.activo = false;
    this.socket?.disconnect();
    this.socket = null;
  }

  private recibir(raw: Partial<ForoMensajeAlerta> & { _id?: string } | null | undefined) {
    if (!raw) return;
    const id = String(raw.id || raw._id || '');
    if (!id || this.vistos.has(id)) return;

    const idPrograma = String(raw.idPrograma || '');
    if (!idPrograma) return;

    if (this.foroAdmin.cursoActivo() === idPrograma) return;

    const alerta: ForoMensajeAlerta = {
      id,
      idPrograma,
      nombrePrograma: String(raw.nombrePrograma || idPrograma),
      autorNombre: String(raw.autorNombre || 'Alumno'),
      texto: String(raw.texto || '').trim(),
      createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    };

    if (!alerta.texto) return;
    if (this._alertas().some((a) => a.id === id)) return;

    this._alertas.update((list) => [alerta, ...list].slice(0, 8));
  }

  abrir(alerta: ForoMensajeAlerta) {
    this.descartar(alerta.id);
    void this.router.navigate(['/app/aula-virtual/foro'], {
      queryParams: { curso: alerta.idPrograma },
    });
  }

  descartar(id: string) {
    const key = String(id || '');
    if (key) this.vistos.add(key);
    this._alertas.update((list) => list.filter((a) => a.id !== key));
  }

  descartarTodas() {
    for (const a of this._alertas()) this.vistos.add(a.id);
    this._alertas.set([]);
  }
}
