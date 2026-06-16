import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface MensajeForoAdmin {
  _id: string;
  idPrograma: string;
  nombrePrograma?: string;
  autorNombre: string;
  autorTipo: 'alumno' | 'instructor' | 'admin';
  autorNumDoc?: number | null;
  texto: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ForoAdminService implements OnDestroy {
  private authSvc = inject(AuthService);
  private socket: Socket | null = null;
  private programaActual: string | null = null;

  mensajes       = signal<MensajeForoAdmin[]>([]);
  conectado      = signal(false);
  cargando       = signal(false);
  error          = signal<string | null>(null);
  enviando       = signal(false);

  private connect() {
    if (this.socket?.connected) return;
    const token = this.authSvc.token();
    if (!token) return;

    const base = environment.apiUrl.replace('/api', '');
    const url = base || window.location.origin;

    this.socket = io(`${url}/foro`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => this.conectado.set(true));
    this.socket.on('disconnect', () => this.conectado.set(false));

    this.socket.on('historial', (msgs: MensajeForoAdmin[]) => {
      this.mensajes.set(msgs);
      this.cargando.set(false);
    });

    this.socket.on('nuevo-mensaje', (msg: MensajeForoAdmin) => {
      if (String(msg.idPrograma) !== String(this.programaActual)) return;
      this.mensajes.update((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    this.socket.on('mensaje-eliminado', ({ _id }: { _id: string }) => {
      this.mensajes.update((prev) => prev.filter((m) => m._id !== _id));
    });

    this.socket.on('error-foro', ({ message }: { message: string }) => {
      this.error.set(message);
      this.enviando.set(false);
    });

    this.socket.on('connect_error', () => {
      this.conectado.set(false);
    });
  }

  joinForo(idPrograma: string, nombrePrograma = '') {
    if (this.programaActual === idPrograma) return;
    if (this.programaActual && this.socket) {
      this.socket.emit('leave-foro', { idPrograma: this.programaActual });
    }
    this.programaActual = idPrograma;
    this.mensajes.set([]);
    this.cargando.set(true);
    this.error.set(null);

    this.connect();

    const payload = { idPrograma, nombrePrograma };
    if (this.socket?.connected) {
      this.socket.emit('join-foro', payload);
    } else {
      this.socket?.once('connect', () => this.socket?.emit('join-foro', payload));
    }
  }

  enviarMensaje(idPrograma: string, texto: string, nombrePrograma = '') {
    if (!this.socket?.connected || !texto.trim() || this.enviando()) return;
    this.enviando.set(true);
    this.socket.emit('enviar-mensaje', { idPrograma, texto: texto.trim(), nombrePrograma });
    this.socket.once('nuevo-mensaje', () => this.enviando.set(false));
    setTimeout(() => this.enviando.set(false), 3000);
  }

  disconnect() {
    if (this.programaActual && this.socket) {
      this.socket.emit('leave-foro', { idPrograma: this.programaActual });
    }
    this.socket?.disconnect();
    this.socket = null;
    this.programaActual = null;
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
