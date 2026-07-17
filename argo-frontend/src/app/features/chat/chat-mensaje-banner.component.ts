import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import {
  ChatMensajeAlertService,
  ChatMensajeAlerta,
} from '../../core/services/chat-mensaje-alert.service';
import { ChatService } from '../../core/services/chat.service';
import { HeadAlarmListBannerComponent } from '../../shared/components/head-alarm-list-banner/head-alarm-list-banner.component';
import type { HeadAlarmListRow } from '../../shared/components/head-alarm-list-banner/head-alarm-list.types';

@Component({
  selector: 'argo-chat-mensaje-banner',
  standalone: true,
  imports: [CommonModule, HeadAlarmListBannerComponent],
  templateUrl: './chat-mensaje-banner.component.html',
  styleUrl: './chat-mensaje-banner.component.scss',
})
export class ChatMensajeBannerComponent {
  private alertSvc = inject(ChatMensajeAlertService);
  private chatSvc = inject(ChatService);

  visible = computed(() => this.alertSvc.alertas().length > 0);

  rows = computed<HeadAlarmListRow[]>(() =>
    this.alertSvc.alertas().map((a) => ({
      id: a.id,
      title: a.deNombre,
      meta: this.resumenTexto(a),
    })),
  );

  onItemClick(row: HeadAlarmListRow): void {
    const a = this.alertSvc.alertas().find((x) => x.id === row.id);
    if (!a) return;
    this.alertSvc.descartarDeUsuario(a.deId);
    this.chatSvc.abrirDesdeAlerta(a.deId);
  }

  onItemDismiss(row: HeadAlarmListRow): void {
    this.alertSvc.descartar(row.id);
  }

  cerrar(): void {
    this.alertSvc.descartarTodas();
  }

  private resumenTexto(a: ChatMensajeAlerta): string {
    const t = a.texto.trim();
    return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  }
}
