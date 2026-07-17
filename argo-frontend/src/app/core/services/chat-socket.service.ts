import { effect, Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Conexión Socket.IO al namespace /chat (mensajería interna 1:1).
 */
@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private auth = inject(AuthService);
  private socket: Socket | null = null;

  constructor() {
    effect(() => {
      if (!this.auth.token()) this.cerrarConexion();
    });
  }

  private socketUrl(): string {
    const base = environment.apiUrl.replace('/api', '');
    return base || window.location.origin;
  }

  /** Obtiene la conexión compartida (la crea o reconecta si hace falta). */
  connect(): Socket | null {
    const token = this.auth.token();
    if (!token) return null;

    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return this.socket;
    }

    this.socket = io(`${this.socketUrl()}/chat`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    return this.socket;
  }

  cerrarConexion(): void {
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return !!this.socket?.connected;
  }
}
