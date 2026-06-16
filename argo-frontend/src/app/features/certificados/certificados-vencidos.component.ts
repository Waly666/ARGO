import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CertificadoService, CertificadoListItem } from '../../core/services/certificado.service';
import { labelTipoCert, TIPOS_CERTIFICADO } from '../../core/constants/tipos-certificado';

@Component({
  selector: 'argo-certificados-vencidos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './certificados-vencidos.component.html',
  styleUrls: ['./certificados-vencidos.component.scss'],
})
export class CertificadosVencidosComponent implements OnInit, OnDestroy {
  private certSvc = inject(CertificadoService);
  private router  = inject(Router);

  readonly porPagina = 100;
  readonly tiposFormato = TIPOS_CERTIFICADO.filter((t) => t.id !== 'jornada_capacitacion');
  readonly labelTipoCert = labelTipoCert;

  loading       = signal(false);
  certificados  = signal<CertificadoListItem[]>([]);
  totalRegistros = signal(0);
  totalPaginas  = signal(1);
  paginaActual  = signal(1);
  filtro        = signal('');
  tipoFormato   = signal('');
  msg           = signal<string | null>(null);

  ngOnInit() { this.cargar(); }
  ngOnDestroy() {}

  cargar(silencioso = false) {
    if (!silencioso) this.loading.set(true);
    this.certSvc.listarVencidos({
      q: this.filtro().trim() || undefined,
      tipoFormatoCert: this.tipoFormato() || undefined,
      page: this.paginaActual(),
      limit: this.porPagina,
      cacheBust: Date.now(),
    }).subscribe({
      next: (res) => {
        this.certificados.set(res.items || []);
        this.totalRegistros.set(res.total || 0);
        this.totalPaginas.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.msg.set(e?.error?.message || 'No se pudieron cargar los certificados vencidos.');
      },
    });
  }

  onFiltroChange(val: string) {
    this.filtro.set(val);
    this.paginaActual.set(1);
    this.cargar(true);
  }

  onTipoChange(val: string) {
    this.tipoFormato.set(val);
    this.paginaActual.set(1);
    this.cargar(true);
  }

  limpiar() {
    this.filtro.set('');
    this.tipoFormato.set('');
    this.paginaActual.set(1);
    this.cargar();
  }

  irPagina(p: number) {
    const pag = Math.max(1, Math.min(p, this.totalPaginas()));
    if (pag === this.paginaActual()) return;
    this.paginaActual.set(pag);
    this.cargar(true);
  }

  pagHasta(): number {
    return Math.min(this.paginaActual() * this.porPagina, this.totalRegistros());
  }

  paginasVisibles(): number[] {
    const total  = this.totalPaginas();
    const actual = this.paginaActual();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    const start = Math.max(2, actual - 2);
    const end   = Math.min(total - 1, actual + 2);
    pages.push(1);
    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  abrirAlumno(c: CertificadoListItem) {
    if (!c.alumnoId) return;
    void this.router.navigate(['/app/alumnos', c.alumnoId], { queryParams: { tab: 'certificados' } });
  }

  fecha(iso?: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO');
  }

  diasDesdeVencimiento(iso?: string | null): number | null {
    if (!iso) return null;
    const fv   = new Date(iso);
    fv.setHours(0, 0, 0, 0);
    const hoy  = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diff = Math.floor((hoy.getTime() - fv.getTime()) / 86400000);
    return diff >= 0 ? diff : null;
  }

  etiquetaDias(iso?: string | null): string {
    const d = this.diasDesdeVencimiento(iso);
    if (d === null) return '—';
    if (d === 0) return 'hoy';
    if (d === 1) return 'ayer';
    return `hace ${d} días`;
  }

  claseDias(iso?: string | null): string {
    const d = this.diasDesdeVencimiento(iso);
    if (d === null) return '';
    if (d <= 7)  return 'dias-chip dias-chip--warn';
    if (d <= 30) return 'dias-chip dias-chip--orange';
    return 'dias-chip dias-chip--red';
  }

  colorTipo(tipo?: string | null): string {
    const map: Record<string, string> = {
      presencial:        'badge-tipo--violet',
      virtual:           'badge-tipo--blue',
      semipresencial:    'badge-tipo--teal',
      empresarial:       'badge-tipo--amber',
      jornada:           'badge-tipo--sky',
    };
    const k = String(tipo || '').toLowerCase();
    for (const [key, cls] of Object.entries(map)) {
      if (k.includes(key)) return cls;
    }
    return 'badge-tipo--gray';
  }
}
