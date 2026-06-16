import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { ForoAdminService, MensajeForoAdmin } from '../../core/services/foro-admin.service';
import { AuthService } from '../../core/services/auth.service';

interface ResumenForo {
  idPrograma: string;
  nombreProg: string;
  codigoProg: string;
  total: number;
  ultimo: string;
}

@Component({
  selector: 'app-foro-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-admin.component.html',
  styleUrl: './foro-admin.component.scss',
})
export class ForoAdminComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  private http    = inject(HttpClient);
  private base    = `${environment.apiUrl}/foro`;
  private route   = inject(ActivatedRoute);
  foroSvc         = inject(ForoAdminService);
  authSvc         = inject(AuthService);

  private cursoPendiente: string | null = null;

  cursos          = signal<ResumenForo[]>([]);
  cursoActivo     = signal<ResumenForo | null>(null);
  cargandoCursos  = signal(false);
  filtroBusqueda  = signal('');
  texto           = signal('');

  private shouldScroll = false;

  cursosFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase();
    if (!q) return this.cursos();
    return this.cursos().filter((c) => c.nombreProg.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.cursoPendiente = params.get('curso');
      this.intentarSeleccionarPendiente();
    });
    this.cargarResumen();
  }

  ngOnDestroy() {
    this.foroSvc.disconnect();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      try { const el = this.chatBody?.nativeElement; if (el) el.scrollTop = el.scrollHeight; } catch {}
      this.shouldScroll = false;
    }
  }

  cargarResumen() {
    const activo = this.cursoActivo();
    this.cargandoCursos.set(true);
    this.http.get<ResumenForo[]>(`${this.base}/admin/resumen`).subscribe({
      next: (rows) => {
        this.cursos.set(rows);
        this.cargandoCursos.set(false);
        if (activo) {
          const actualizado = rows.find((x) => String(x.idPrograma) === String(activo.idPrograma));
          if (actualizado) this.cursoActivo.set(actualizado);
          this.foroSvc.recargarMensajes();
        }
        this.intentarSeleccionarPendiente();
      },
      error: () => this.cargandoCursos.set(false),
    });
  }

  private intentarSeleccionarPendiente() {
    if (!this.cursoPendiente) return;
    const id = this.cursoPendiente;
    const c = this.cursos().find((x) => String(x.idPrograma) === String(id));
    if (!c) return;
    this.seleccionarCurso(c);
    this.cursoPendiente = null;
  }

  seleccionarCurso(c: ResumenForo) {
    this.cursoActivo.set(c);
    this.texto.set('');
    this.foroSvc.joinForo(c.idPrograma, c.nombreProg);
    this.shouldScroll = true;
  }

  enviar() {
    const c = this.cursoActivo();
    const t = this.texto().trim();
    if (!c || !t) return;
    this.foroSvc.enviarMensaje(c.idPrograma, t, c.nombreProg);
    this.texto.set('');
    this.shouldScroll = true;
  }

  onKeydown(ev: KeyboardEvent) {
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); this.enviar(); }
  }

  eliminarMensaje(msg: MensajeForoAdmin) {
    if (!confirm('¿Eliminar este mensaje del foro?')) return;
    this.http.delete(`${this.base}/admin/mensajes/${msg._id}`).subscribe({
      next: () => {
        this.foroSvc.mensajes.update((prev) => prev.filter((m) => m._id !== msg._id));
        const cur = this.cursoActivo();
        if (cur) this.cursos.update((cs) => cs.map((c) => c.idPrograma === cur.idPrograma ? { ...c, total: Math.max(0, c.total - 1) } : c));
      },
    });
  }

  tipoBadgeClass(tipo: MensajeForoAdmin['autorTipo']) {
    if (tipo === 'admin') return 'badge-admin';
    if (tipo === 'instructor') return 'badge-instructor';
    return 'badge-alumno';
  }

  tipoLabel(tipo: MensajeForoAdmin['autorTipo']) {
    if (tipo === 'admin') return '🛡 Admin';
    if (tipo === 'instructor') return '👨‍🏫 Instructor';
    return '🎓 Alumno';
  }

  formatFecha(iso: string) {
    try { return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }

  inicialAvatar(nombre: string) {
    return (nombre || '?').charAt(0).toUpperCase();
  }
}
