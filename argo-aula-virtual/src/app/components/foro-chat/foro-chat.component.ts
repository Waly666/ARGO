import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ForoService, MensajeForo } from '../../core/foro.service';
import { PortalAuthService } from '../../core/portal-auth.service';

@Component({
  selector: 'av-foro-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-chat.component.html',
  styleUrl: './foro-chat.component.scss',
})
export class ForoChatComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() idPrograma!: string;
  @Input() nombreCurso = '';

  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  foro = inject(ForoService);
  auth = inject(PortalAuthService);

  texto = signal('');
  filtro = signal<'todos' | 'mios'>('todos');
  enviando = signal(false);
  private shouldScroll = false;

  mensajesFiltrados = computed(() => {
    const msgs = this.foro.mensajes();
    if (this.filtro() === 'mios') {
      const numDoc = this.auth.user()?.numDoc;
      return msgs.filter((m) => m.autorNumDoc === numDoc);
    }
    return msgs;
  });

  ngOnInit() {
    if (this.idPrograma) {
      this.foro.joinForo(this.idPrograma, this.nombreCurso);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idPrograma'] && !changes['idPrograma'].firstChange) {
      this.foro.joinForo(this.idPrograma, this.nombreCurso);
    }
  }

  ngOnDestroy() {
    this.foro.leaveForo();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollBottom();
      this.shouldScroll = false;
    }
  }

  enviar() {
    const t = this.texto().trim();
    if (!t || this.enviando()) return;
    this.foro.enviarMensaje(this.idPrograma, t);
    this.texto.set('');
    this.shouldScroll = true;
  }

  onKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      this.enviar();
    }
  }

  private scrollBottom() {
    try {
      const el = this.chatBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  esPropio(msg: MensajeForo) {
    return msg.autorNumDoc != null && msg.autorNumDoc === this.auth.user()?.numDoc;
  }

  inicialAvatar(nombre: string) {
    return (nombre || '?').charAt(0).toUpperCase();
  }

  tipoBadge(tipo: MensajeForo['autorTipo']) {
    if (tipo === 'admin') return '🛡 Admin';
    if (tipo === 'instructor') return '👨‍🏫 Instructor';
    return '';
  }

  trackMsg(_: number, msg: MensajeForo) {
    return msg._id;
  }

  formatHora(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  formatFecha(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }
}
