import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { PortalAuthService } from './portal-auth.service';

export interface MensajeForo {
  _id: string;
  idPrograma: string;
  autorNombre: string;
  autorTipo: 'alumno' | 'instructor' | 'admin';
  autorNumDoc?: number | null;
  texto: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ForoService implements OnDestroy {
  private auth = inject(PortalAuthService);
  private socket: Socket | null = null;
  private programaActual: string | null = null;

  mensajes   = signal<MensajeForo[]>([]);
  conectado  = signal(false);
  cargando   = signal(false);
  error      = signal<string | null>(null);

  private connect() {
    if (this.socket?.connected) return;

    const token = this.auth.token();
    if (!token) return;

    const url = environment.socketUrl || window.location.origin;

    this.socket = io(`${url}/foro`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => this.conectado.set(true));
    this.socket.on('disconnect', () => this.conectado.set(false));

    this.socket.on('historial', (msgs: MensajeForo[]) => {
      this.mensajes.set(msgs);
      this.cargando.set(false);
    });

    this.socket.on('nuevo-mensaje', (msg: MensajeForo) => {
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
      this.cargando.set(false);
    });

    this.socket.on('connect_error', () => {
      this.conectado.set(false);
      this.error.set('No se pudo conectar al foro en tiempo real.');
      this.cargando.set(false);
    });
  }

  private nombreActual: string = '';

  joinForo(idPrograma: string, nombrePrograma = '') {
    if (this.programaActual === idPrograma) return;
    if (this.programaActual) this.leaveForo();

    this.programaActual = idPrograma;
    this.nombreActual   = nombrePrograma;
    this.mensajes.set([]);
    this.cargando.set(true);
    this.error.set(null);

    this.connect();

    const payload = { idPrograma, nombrePrograma };
    if (this.socket?.connected) {
      this.socket.emit('join-foro', payload);
    } else {
      this.socket?.once('connect', () => {
        this.socket?.emit('join-foro', payload);
      });
    }
  }

  leaveForo() {
    if (this.programaActual && this.socket) {
      this.socket.emit('leave-foro', { idPrograma: this.programaActual });
    }
    this.programaActual = null;
    this.mensajes.set([]);
    this.cargando.set(false);
  }

  enviarMensaje(idPrograma: string, texto: string) {
    if (!this.socket?.connected || !texto.trim()) return;
    this.socket.emit('enviar-mensaje', { idPrograma, texto: texto.trim(), nombrePrograma: this.nombreActual });
  }

  ngOnDestroy() {
    this.leaveForo();
    this.socket?.disconnect();
    this.socket = null;
  }
}
