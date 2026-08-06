import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  AulaVirtualAdminService,
  ProgresoAlumnoVirtualClase,
  ProgresoAlumnoVirtualIntento,
  ProgresoAlumnoVirtualItem,
} from '../../core/services/aula-virtual-admin.service';
import { formatNumDoc } from '../../core/utils/num-doc.helpers';

type ReglasCurso = {
  modoCertificado: string;
  pctMinCompletitud: number;
  pctMinEvaluaciones: number;
  intentosMaxEval: number;
};

@Component({
  selector: 'argo-aula-virtual-progreso-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aula-virtual-progreso-alumnos.component.html',
  styleUrls: ['./aula-virtual-progreso-alumnos.component.scss'],
})
export class AulaVirtualProgresoAlumnosComponent implements OnChanges {
  private svc = inject(AulaVirtualAdminService);

  @Input({ required: true }) idPrograma!: string;
  @Input() reloadTick = 0;

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<ProgresoAlumnoVirtualItem[]>([]);
  reglas = signal<ReglasCurso | null>(null);
  total = signal(0);
  skip = signal(0);
  readonly limit = 20;

  buscar = '';
  filtro = '';
  expandido = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['idPrograma'] || changes['reloadTick']) {
      this.skip.set(0);
      this.cargar();
    }
  }

  cargar(): void {
    if (!this.idPrograma) return;
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .listarProgresoAlumnos(this.idPrograma, {
        q: this.buscar.trim() || undefined,
        filtro: this.filtro || undefined,
        skip: this.skip(),
        limit: this.limit,
      })
      .subscribe({
        next: (r) => {
          this.items.set(r.items || []);
          this.total.set(r.total || 0);
          this.reglas.set(r.reglas);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(e?.error?.message || 'No se pudo cargar el progreso');
          this.loading.set(false);
        },
      });
  }

  buscarAlumnos(): void {
    this.skip.set(0);
    this.cargar();
  }

  cambiarFiltro(f: string): void {
    this.filtro = f;
    this.skip.set(0);
    this.cargar();
  }

  paginaAnterior(): void {
    const s = Math.max(0, this.skip() - this.limit);
    if (s === this.skip()) return;
    this.skip.set(s);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.skip() + this.limit >= this.total()) return;
    this.skip.set(this.skip() + this.limit);
    this.cargar();
  }

  fmtDoc(n: number | string): string {
    return formatNumDoc(n);
  }

  fmtFecha(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  fmtFechaMat(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  claseConexion(codigo: string): string {
    if (codigo === 'en_linea') return 'av-score-conn--live';
    if (codigo === 'reciente') return 'av-score-conn--recent';
    if (codigo === 'desconectado') return 'av-score-conn--off';
    return 'av-score-conn--none';
  }

  fichaLink(row: ProgresoAlumnoVirtualItem): string[] | null {
    return row.alumnoId ? ['/app/alumnos', row.alumnoId] : null;
  }

  trackRow(row: ProgresoAlumnoVirtualItem): string {
    return String(row.numDoc);
  }

  toggleExpand(row: ProgresoAlumnoVirtualItem): void {
    const key = this.trackRow(row);
    this.expandido.update((v) => (v === key ? null : key));
  }

  estaExpandido(row: ProgresoAlumnoVirtualItem): boolean {
    return this.expandido() === this.trackRow(row);
  }

  pctMinCompletitud(): number {
    return this.reglas()?.pctMinCompletitud ?? 80;
  }

  notaMinima(): number {
    return this.reglas()?.pctMinEvaluaciones ?? 60;
  }

  intentosMaxEval(): number {
    return this.reglas()?.intentosMaxEval ?? 3;
  }

  pct(row: ProgresoAlumnoVirtualItem): number {
    return row.progreso?.pctCompletitud ?? 0;
  }

  clasesDetalle(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualClase[] {
    const clases = row.progreso?.clases || [];
    const total = Math.max(
      row.progreso?.totalClases ?? 0,
      ...clases.map((c) => c.numero),
      clases.length ? 0 : 7,
    );
    const map = new Map(clases.map((c) => [c.numero, c]));
    const out: ProgresoAlumnoVirtualClase[] = [];
    for (let i = 1; i <= total; i++) {
      out.push(map.get(i) ?? { numero: i, pct: 0, aprobada: false });
    }
    return out;
  }

  leccionesConNotaCount(row: ProgresoAlumnoVirtualItem): number {
    return this.clasesDetalle(row).filter((c) => c.pct > 0).length;
  }

  promedioLecciones(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso?.promedioClases;
    return p != null ? p : null;
  }

  sumaPuntajesLecciones(row: ProgresoAlumnoVirtualItem): number {
    return this.clasesDetalle(row).reduce((acc, c) => acc + c.pct, 0);
  }

  intentosDe(row: ProgresoAlumnoVirtualItem): ProgresoAlumnoVirtualIntento[] {
    return row.progreso?.intentos || [];
  }

  intentosRestantes(row: ProgresoAlumnoVirtualItem): number {
    return row.progreso?.intentosRestantes ?? Math.max(0, this.intentosMaxEval() - (row.progreso?.intentosEval ?? 0));
  }

  puedeReintentar(row: ProgresoAlumnoVirtualItem): boolean {
    return this.intentosRestantes(row) > 0 && !this.cumpleRequisitosCurso(row);
  }

  cumpleRequisitosCurso(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.aprobado) return true;
    return this.cumpleCompletitud(row) && this.cumpleNotaEval(row);
  }

  mejorNota(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso;
    if (p?.mejorNotaEval != null) return p.mejorNotaEval;
    const intentos = this.intentosDe(row);
    if (!intentos.length) return null;
    return Math.max(...intentos.map((i) => i.nota));
  }

  ultimaNotaEval(row: ProgresoAlumnoVirtualItem): number | null {
    const p = row.progreso;
    if (p?.ultimaNotaEval != null && p.ultimaNotaEval > 0) return p.ultimaNotaEval;
    const intentos = this.intentosDe(row);
    if (!intentos.length) return null;
    return intentos[intentos.length - 1].nota;
  }

  cumpleCompletitud(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.cumpleCompletitud != null) return row.progreso.cumpleCompletitud;
    return this.pct(row) >= this.pctMinCompletitud();
  }

  cumpleNotaEval(row: ProgresoAlumnoVirtualItem): boolean {
    if (row.progreso?.cumpleNota != null) return row.progreso.cumpleNota;
    const mn = this.mejorNota(row);
    return mn != null && mn >= this.notaMinima();
  }

  estadoAlumno(row: ProgresoAlumnoVirtualItem): string {
    if (row.progreso?.certificadoEmitido) return 'Certificado emitido';
    if (row.progreso?.aprobado) return 'Aprobado';
    if (row.progreso?.sinIniciar) return 'Sin iniciar';
    if (this.pct(row) > 0 || this.leccionesConNotaCount(row) > 0 || this.intentosDe(row).length) {
      return 'En progreso';
    }
    return 'Sin iniciar';
  }

  tonoEstado(row: ProgresoAlumnoVirtualItem): string {
    if (row.progreso?.certificadoEmitido) return 'cyan';
    if (row.progreso?.aprobado) return 'green';
    if (row.progreso?.sinIniciar && this.pct(row) <= 0) return 'soft';
    return 'amber';
  }

  notaClaseAprobada(): number {
    return 70;
  }

  claseNotaTone(pct: number): 'ok' | 'mid' | 'low' {
    if (pct >= this.notaClaseAprobada()) return 'ok';
    if (pct >= 50) return 'mid';
    return 'low';
  }

  notaTone(nota: number, min?: number): 'ok' | 'mid' | 'low' {
    const m = min ?? this.notaMinima();
    if (nota >= m) return 'ok';
    if (nota >= m - 15) return 'mid';
    return 'low';
  }

  labelResultadoIntento(it: ProgresoAlumnoVirtualIntento): string {
    if (it.aprobado) return 'Aprobó';
    if (it.motivoNoAprobado === 'avance_insuficiente') return 'Avance insuficiente';
    if (it.motivoNoAprobado === 'nota_insuficiente') return 'Nota insuficiente';
    if (it.motivoNoAprobado === 'nota_y_avance') return 'Nota y avance bajos';
    if (it.nota >= this.notaMinima() && it.pctCompletitud < this.pctMinCompletitud()) {
      return 'Avance insuficiente';
    }
    return 'No aprobó';
  }

  tonoResultadoIntento(it: ProgresoAlumnoVirtualIntento): 'ok' | 'warn' | 'bad' {
    if (it.aprobado) return 'ok';
    if (this.labelResultadoIntento(it) === 'Avance insuficiente') return 'warn';
    return 'bad';
  }

  alumnoInactivo(row: ProgresoAlumnoVirtualItem): boolean {
    return !!(row.progreso?.sinIniciar && this.pct(row) <= 0);
  }
}
