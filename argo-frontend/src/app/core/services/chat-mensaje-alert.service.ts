import { Injectable, signal } from '@angular/core';

export interface ChatMensajeAlerta {
  id: string;
  deId: string;
  deNombre: string;
  texto: string;
  createdAt?: string;
}

/**
 * Alertas de cabecera para mensajes de chat internos (1:1).
 * El clic se maneja en el banner → abre el panel y la conversación.
 */
@Injectable({ providedIn: 'root' })
export class ChatMensajeAlertService {
  private vistos = new Set<string>();
  private readonly _alertas = signal<ChatMensajeAlerta[]>([]);
  readonly alertas = this._alertas.asReadonly();

  notificar(raw: Partial<ChatMensajeAlerta> & { _id?: string } | null | undefined): void {
    if (!raw) return;
    const id = String(raw.id || raw._id || '');
    const deId = String(raw.deId || '');
    if (!id || !deId || this.vistos.has(id)) return;

    const texto = String(raw.texto || '').trim();
    if (!texto) return;
    if (this._alertas().some((a) => a.id === id)) return;

    const alerta: ChatMensajeAlerta = {
      id,
      deId,
      deNombre: String(raw.deNombre || 'Usuario'),
      texto,
      createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    };

    this._alertas.update((list) => [alerta, ...list].slice(0, 10));
  }

  descartar(id: string): void {
    const key = String(id || '');
    if (key) this.vistos.add(key);
    this._alertas.update((list) => list.filter((a) => a.id !== key));
  }

  /** Quita alertas de un remitente (al abrir su conversación). */
  descartarDeUsuario(deId: string): void {
    const uid = String(deId || '');
    if (!uid) return;
    const actuales = this._alertas().filter((a) => a.deId === uid);
    for (const a of actuales) this.vistos.add(a.id);
    this._alertas.update((list) => list.filter((a) => a.deId !== uid));
  }

  descartarTodas(): void {
    for (const a of this._alertas()) this.vistos.add(a.id);
    this._alertas.set([]);
  }

  limpiar(): void {
    this._alertas.set([]);
    this.vistos.clear();
  }
}
