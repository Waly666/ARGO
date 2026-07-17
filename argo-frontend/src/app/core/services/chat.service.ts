import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ChatSocketService } from './chat-socket.service';
import { ChatMensajeAlertService } from './chat-mensaje-alert.service';

export interface ChatUltimoMensaje {
  texto: string;
  createdAt: string | Date;
  deId: string;
}

export interface ChatContacto {
  _id: string;
  username: string;
  nombres: string;
  apellidos: string;
  nombre: string;
  rol: string;
  urlFoto: string | null;
  enLinea: boolean;
  noLeidos: number;
  ultimoMensaje: ChatUltimoMensaje | null;
}

export interface ChatMensaje {
  _id: string;
  convKey: string;
  deId: string;
  paraId: string;
  deNombre: string;
  texto: string;
  leido: boolean;
  leidoAt: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private chatSocket = inject(ChatSocketService);
  private chatAlert = inject(ChatMensajeAlertService);
  private base = `${environment.apiUrl}/chat`;

  private _contactos = signal<ChatContacto[]>([]);
  private _online = signal<Set<string>>(new Set());
  private _mensajes = signal<ChatMensaje[]>([]);
  private _activoId = signal<string | null>(null);
  private _abierto = signal(false);
  private _cargandoContactos = signal(false);
  private _cargandoMensajes = signal(false);
  private escuchando = false;

  readonly contactos = this._contactos.asReadonly();
  readonly mensajes = this._mensajes.asReadonly();
  readonly activoId = this._activoId.asReadonly();
  readonly abierto = this._abierto.asReadonly();
  readonly cargandoContactos = this._cargandoContactos.asReadonly();
  readonly cargandoMensajes = this._cargandoMensajes.asReadonly();

  readonly totalNoLeidos = computed(() =>
    this._contactos().reduce((acc, c) => acc + (c.noLeidos || 0), 0),
  );

  readonly contactoActivo = computed(() => {
    const id = this._activoId();
    if (!id) return null;
    return this._contactos().find((c) => c._id === id) || null;
  });

  readonly miId = computed(() => this.auth.user()?._id || null);

  private onMensaje = (msg: ChatMensaje) => this.recibirMensaje(msg);
  private onPresencia = (p: { userId: string; online: boolean }) => this.aplicarPresencia(p);
  private onOnline = (p: { userIds: string[] }) => {
    this._online.set(new Set((p.userIds || []).map(String)));
    this.sincronizarPresenciaEnContactos();
  };
  private onLeidoConfirm = (p: { deId: string; paraId: string }) => this.aplicarLeidoConfirm(p);

  /** Arranca socket + carga contactos (llamar desde el shell al autenticarse). */
  conectar(): void {
    const socket = this.chatSocket.connect();
    if (!socket) return;

    // Re-bind siempre: tras logout el socket se recrea y hay que volver a escuchar.
    socket.off('chat:mensaje', this.onMensaje);
    socket.off('chat:presencia', this.onPresencia);
    socket.off('chat:online', this.onOnline);
    socket.off('chat:leido-confirm', this.onLeidoConfirm);
    socket.off('connect');

    socket.on('chat:mensaje', this.onMensaje);
    socket.on('chat:presencia', this.onPresencia);
    socket.on('chat:online', this.onOnline);
    socket.on('chat:leido-confirm', this.onLeidoConfirm);
    socket.on('connect', () => {
      void this.cargarContactos();
    });
    this.escuchando = true;

    void this.cargarContactos();
  }

  desconectar(): void {
    this.escuchando = false;
    this.chatAlert.limpiar();
    this.chatSocket.cerrarConexion();
  }

  abrirPanel(): void {
    this._abierto.set(true);
    void this.cargarContactos();
  }

  /** Abre el panel y la conversación (desde la alerta de cabecera). */
  abrirDesdeAlerta(deId: string): void {
    this.chatAlert.descartarDeUsuario(deId);
    this.abrirPanel();
    void this.abrirConversacion(deId);
  }

  cerrarPanel(): void {
    this._abierto.set(false);
  }

  togglePanel(): void {
    if (this._abierto()) this.cerrarPanel();
    else this.abrirPanel();
  }

  async cargarContactos(): Promise<void> {
    if (!this.auth.token()) return;
    this._cargandoContactos.set(true);
    try {
      const rows = await firstValueFrom(this.http.get<ChatContacto[]>(`${this.base}/contactos`));
      const online = this._online();
      const mapped = (rows || []).map((c) => ({
        ...c,
        enLinea: online.has(c._id) || !!c.enLinea,
      }));
      this._contactos.set(mapped);
    } catch {
      // silent
    } finally {
      this._cargandoContactos.set(false);
    }
  }

  async refrescarNoLeidos(): Promise<void> {
    if (!this.auth.token()) return;
    try {
      const r = await firstValueFrom(this.http.get<{ total: number }>(`${this.base}/no-leidos`));
      // Si no hay contactos cargados aún, al menos no rompemos; el badge se actualiza al cargar.
      if (!this._contactos().length && (r?.total || 0) > 0) {
        // placeholder: se resolerá al abrir/cargar contactos
      }
    } catch {
      // silent
    }
  }

  async abrirConversacion(otroId: string): Promise<void> {
    const id = String(otroId);
    this._activoId.set(id);
    this.chatAlert.descartarDeUsuario(id);
    this._cargandoMensajes.set(true);
    try {
      const r = await firstValueFrom(
        this.http.get<{ convKey: string; mensajes: ChatMensaje[] }>(
          `${this.base}/conversacion/${id}`,
        ),
      );
      this._mensajes.set(r?.mensajes || []);
      this.actualizarNoLeidosContacto(id, 0);

      const socket = this.chatSocket.connect();
      socket?.emit('chat:leido', { deId: id });
    } catch {
      this._mensajes.set([]);
    } finally {
      this._cargandoMensajes.set(false);
    }
  }

  enviar(texto: string): void {
    const paraId = this._activoId();
    const t = String(texto || '').trim();
    if (!paraId || !t) return;

    const socket = this.chatSocket.connect();
    if (!socket) return;
    socket.emit('chat:enviar', { paraId, texto: t });
  }

  private recibirMensaje(msg: ChatMensaje): void {
    if (!msg?._id) return;
    const yo = this.miId();
    const activo = this._activoId();
    const panelAbierto = this._abierto();
    const esDeActiva =
      !!activo &&
      ((msg.deId === activo && msg.paraId === yo) || (msg.deId === yo && msg.paraId === activo));

    if (esDeActiva && panelAbierto) {
      this._mensajes.update((list) => {
        if (list.some((m) => m._id === msg._id)) return list;
        return [...list, msg];
      });
      if (msg.paraId === yo && msg.deId === activo) {
        const socket = this.chatSocket.connect();
        socket?.emit('chat:leido', { deId: msg.deId });
        this.actualizarNoLeidosContacto(msg.deId, 0);
        this.chatAlert.descartarDeUsuario(msg.deId);
      }
    } else if (msg.paraId === yo) {
      this.incrementarNoLeidos(msg.deId);
      // Alarma en cabecera si no está viendo esa conversación
      this.chatAlert.notificar({
        _id: msg._id,
        deId: msg.deId,
        deNombre: msg.deNombre,
        texto: msg.texto,
        createdAt: msg.createdAt ? String(msg.createdAt) : undefined,
      });
    }

    this.actualizarUltimoEnContacto(msg);
  }

  private aplicarPresencia(p: { userId: string; online: boolean }): void {
    const id = String(p.userId || '');
    if (!id) return;
    this._online.update((set) => {
      const next = new Set(set);
      if (p.online) next.add(id);
      else next.delete(id);
      return next;
    });
    this._contactos.update((list) =>
      list.map((c) => (c._id === id ? { ...c, enLinea: !!p.online } : c)),
    );
  }

  private sincronizarPresenciaEnContactos(): void {
    const online = this._online();
    this._contactos.update((list) =>
      list.map((c) => ({ ...c, enLinea: online.has(c._id) })),
    );
  }

  private aplicarLeidoConfirm(p: { deId: string; paraId: string }): void {
    const yo = this.miId();
    if (!yo) return;
    // El destinatario (paraId) leyó mensajes que yo (deId) envié
    if (String(p.deId) !== String(yo)) return;
    const otro = String(p.paraId);
    if (this._activoId() === otro) {
      this._mensajes.update((list) =>
        list.map((m) =>
          m.deId === yo && m.paraId === otro && !m.leido
            ? { ...m, leido: true, leidoAt: new Date().toISOString() }
            : m,
        ),
      );
    }
  }

  private incrementarNoLeidos(deId: string): void {
    this._contactos.update((list) => {
      const exists = list.some((c) => c._id === deId);
      if (!exists) {
        // Recargar contactos para incluir al remitente
        void this.cargarContactos();
        return list;
      }
      return list.map((c) =>
        c._id === deId ? { ...c, noLeidos: (c.noLeidos || 0) + 1 } : c,
      );
    });
  }

  private actualizarNoLeidosContacto(id: string, n: number): void {
    this._contactos.update((list) =>
      list.map((c) => (c._id === id ? { ...c, noLeidos: n } : c)),
    );
  }

  private actualizarUltimoEnContacto(msg: ChatMensaje): void {
    const yo = this.miId();
    const otroId = msg.deId === yo ? msg.paraId : msg.deId;
    this._contactos.update((list) => {
      const next = list.map((c) =>
        c._id === otroId
          ? {
              ...c,
              ultimoMensaje: {
                texto: msg.texto,
                createdAt: msg.createdAt,
                deId: msg.deId,
              },
            }
          : c,
      );
      return [...next].sort((a, b) => {
        const ta = a.ultimoMensaje?.createdAt ? new Date(a.ultimoMensaje.createdAt).getTime() : 0;
        const tb = b.ultimoMensaje?.createdAt ? new Date(b.ultimoMensaje.createdAt).getTime() : 0;
        if (tb !== ta) return tb - ta;
        if (a.enLinea !== b.enLinea) return a.enLinea ? -1 : 1;
        return a.nombre.localeCompare(b.nombre, 'es');
      });
    });
  }
}
