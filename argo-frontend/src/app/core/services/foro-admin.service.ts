import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  private http = inject(HttpClient);

  private socket: Socket | null = null;
  private listenersAttached = false;
  private programaActual: string | null = null;
  private nombreProgramaActual = '';

  mensajes       = signal<MensajeForoAdmin[]>([]);
  conectado      = signal(false);
  cargando       = signal(false);
  error          = signal<string | null>(null);
  enviando       = signal(false);
  /** Curso cuyo chat está abierto (para suprimir alertas duplicadas). */
  cursoActivo    = signal<string | null>(null);

  private socketBase(): string {
    return environment.apiUrl.replace('/api', '') || window.location.origin;
  }

  private ensureSocket() {
    const token = this.authSvc.token();
    if (!token) return;

    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return;
    }

    this.socket = io(`${this.socketBase()}/foro`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    if (this.listenersAttached) return;
    this.listenersAttached = true;

    this.socket.on('connect', () => {
      this.conectado.set(true);
      if (this.programaActual) {
        this.emitJoin(this.programaActual, this.nombreProgramaActual);
      }
    });

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

  private emitJoin(idPrograma: string, nombrePrograma: string) {
    this.socket?.emit('join-foro', { idPrograma, nombrePrograma });
  }

  /** Carga confiable vía REST (no depende del timing del WebSocket). */
  cargarMensajesRest(idPrograma: string) {
    const id = String(idPrograma);
    this.cargando.set(true);
    this.error.set(null);

    const url = `${environment.apiUrl}/foro/admin/cursos/${encodeURIComponent(id)}/mensajes?limit=200`;
    this.http.get<{ mensajes: MensajeForoAdmin[] }>(url).subscribe({
      next: (res) => {
        if (String(this.programaActual) !== id) return;
        this.mensajes.set(res.mensajes || []);
        this.cargando.set(false);
      },
      error: (e) => {
        if (String(this.programaActual) !== id) return;
        this.cargando.set(false);
        this.error.set(e?.error?.message || 'No se pudieron cargar los mensajes');
      },
    });
  }

  joinForo(idPrograma: string, nombrePrograma = '') {
    const id = String(idPrograma);
    const nom = String(nombrePrograma || '');

    if (this.programaActual && this.programaActual !== id) {
      this.socket?.emit('leave-foro', { idPrograma: this.programaActual });
    }

    this.programaActual = id;
    this.nombreProgramaActual = nom;
    this.cursoActivo.set(id);
    this.mensajes.set([]);
    this.error.set(null);

    this.cargarMensajesRest(id);
    this.ensureSocket();

    if (this.socket?.connected) {
      this.emitJoin(id, nom);
    }
  }

  /** Vuelve a cargar mensajes del curso activo (p. ej. botón Actualizar). */
  recargarMensajes() {
    if (!this.programaActual) return;
    this.cargarMensajesRest(this.programaActual);
    this.ensureSocket();
    if (this.socket?.connected) {
      this.emitJoin(this.programaActual, this.nombreProgramaActual);
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
    this.listenersAttached = false;
    this.programaActual = null;
    this.nombreProgramaActual = '';
    this.cursoActivo.set(null);
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
