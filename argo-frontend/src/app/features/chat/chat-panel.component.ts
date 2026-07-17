import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatContacto, ChatService } from '../../core/services/chat.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './chat-panel.component.html',
  styleUrls: ['./chat-panel.component.scss'],
})
export class ChatPanelComponent {
  readonly chat = inject(ChatService);

  @ViewChild('hilo') hiloRef?: ElementRef<HTMLDivElement>;

  filtro = signal('');
  borrador = signal('');

  constructor() {
    effect(() => {
      // Scroll al final cuando llegan mensajes o se abre conversación
      const msgs = this.chat.mensajes();
      const activo = this.chat.activoId();
      if (!activo || !msgs) return;
      queueMicrotask(() => this.scrollAlFinal());
    });
  }

  contactosFiltrados(): ChatContacto[] {
    const q = this.filtro().trim().toLowerCase();
    const list = this.chat.contactos();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        (c.rol || '').toLowerCase().includes(q),
    );
  }

  seleccionar(c: ChatContacto): void {
    void this.chat.abrirConversacion(c._id);
  }

  enviar(): void {
    const t = this.borrador().trim();
    if (!t) return;
    this.chat.enviar(t);
    this.borrador.set('');
  }

  onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.enviar();
    }
  }

  esMio(deId: string): boolean {
    return deId === this.chat.miId();
  }

  fotoUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = environment.uploadsUrl || environment.apiUrl.replace('/api', '') + '/uploads';
    return url.startsWith('/') ? `${base.replace(/\/uploads$/, '')}${url}` : `${base}/${url}`;
  }

  iniciales(nombre: string): string {
    const parts = String(nombre || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  private scrollAlFinal(): void {
    const el = this.hiloRef?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
