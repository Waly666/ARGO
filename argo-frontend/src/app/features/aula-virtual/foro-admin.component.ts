import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface ResumenForo {
  idPrograma: string;
  nombreProg: string;
  codigoProg: string;
  total: number;
  ultimo: string;
}

interface MensajeForo {
  _id: string;
  idPrograma: string;
  autorNombre: string;
  autorTipo: 'alumno' | 'instructor' | 'admin';
  autorNumDoc?: number | null;
  texto: string;
  createdAt: string;
}

@Component({
  selector: 'app-foro-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-admin.component.html',
  styleUrl: './foro-admin.component.scss',
})
export class ForoAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/foro`;

  cursos = signal<ResumenForo[]>([]);
  cursoActivo = signal<ResumenForo | null>(null);
  mensajes = signal<MensajeForo[]>([]);

  cargandoCursos = signal(false);
  cargandoMensajes = signal(false);

  filtroBusqueda = signal('');

  cursosFiltrados = computed(() => {
    const q = this.filtroBusqueda().toLowerCase();
    if (!q) return this.cursos();
    return this.cursos().filter(
      (c) => c.nombreProg.toLowerCase().includes(q) || c.codigoProg?.toLowerCase().includes(q),
    );
  });

  ngOnInit() {
    this.cargarResumen();
  }

  cargarResumen() {
    this.cargandoCursos.set(true);
    this.http.get<ResumenForo[]>(`${this.base}/admin/resumen`).subscribe({
      next: (rows) => { this.cursos.set(rows); this.cargandoCursos.set(false); },
      error: () => this.cargandoCursos.set(false),
    });
  }

  seleccionarCurso(c: ResumenForo) {
    this.cursoActivo.set(c);
    this.cargarMensajes(c.idPrograma);
  }

  cargarMensajes(idPrograma: string) {
    this.cargandoMensajes.set(true);
    this.http
      .get<{ mensajes: MensajeForo[] }>(`${this.base}/admin/cursos/${idPrograma}/mensajes?limit=100`)
      .subscribe({
        next: (res) => { this.mensajes.set(res.mensajes); this.cargandoMensajes.set(false); },
        error: () => this.cargandoMensajes.set(false),
      });
  }

  eliminarMensaje(msg: MensajeForo) {
    if (!confirm('¿Eliminar este mensaje del foro?')) return;
    this.http.delete(`${this.base}/admin/mensajes/${msg._id}`).subscribe({
      next: () => {
        this.mensajes.update((prev) => prev.filter((m) => m._id !== msg._id));
        const cur = this.cursoActivo();
        if (cur) this.cursos.update((cs) => cs.map((c) => c.idPrograma === cur.idPrograma ? { ...c, total: Math.max(0, c.total - 1) } : c));
      },
    });
  }

  tipoBadgeClass(tipo: MensajeForo['autorTipo']) {
    if (tipo === 'admin') return 'badge-admin';
    if (tipo === 'instructor') return 'badge-instructor';
    return 'badge-alumno';
  }

  tipoLabel(tipo: MensajeForo['autorTipo']) {
    if (tipo === 'admin') return '🛡 Admin';
    if (tipo === 'instructor') return '👨‍🏫 Instructor';
    return '🎓 Alumno';
  }

  formatFecha(iso: string) {
    try { return new Date(iso).toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  }
}
