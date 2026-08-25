import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BackupResetRestoreNavComponent } from './backup-reset-restore-nav.component';
import {
  ConfigHorarioOperacion,
  ConfigHorarioOperacionService,
  HorarioOperacionCatalogos,
  ReglaHorarioRol,
  VentanaHorario,
} from '../../core/services/config-horario-operacion.service';

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const DIA_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const DIA_CORTO: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

type PestanaHorarios = 'general' | 'porRol';
type PresetDias = 'lun-vie' | 'todos' | 'fin-semana';

@Component({
  selector: 'argo-sistema-horario-operacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BackupResetRestoreNavComponent],
  templateUrl: './sistema-horario-operacion.component.html',
  styleUrls: ['./sistema-horario-operacion.component.scss', './sistema-shared.scss'],
})
export class SistemaHorarioOperacionComponent implements OnInit {
  private svc = inject(ConfigHorarioOperacionService);

  readonly opcionesGracia = [
    { min: 15, label: '15 minutos' },
    { min: 30, label: '30 minutos (recomendado)' },
    { min: 45, label: '45 minutos' },
    { min: 60, label: '1 hora' },
    { min: 90, label: '1 hora y media' },
    { min: 120, label: '2 horas' },
    { min: 180, label: '3 horas' },
  ];

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  error = signal(false);
  catalogos = signal<HorarioOperacionCatalogos | null>(null);
  pestanaHorarios = signal<PestanaHorarios>('general');
  mostrarAvanzado = signal(false);

  cfg = signal<ConfigHorarioOperacion>({
    activo: false,
    zonaHoraria: 'America/Bogota',
    minutosGracia: 30,
    extenderSiCajaAbierta: true,
    mensajeFueraHorario: '',
    mensajeGracia: '',
    reglasGenerales: [],
    reglasPorRol: [],
  });

  resumenActivo = computed(() => {
    const c = this.cfg();
    if (!c.activo) return 'La restricción está apagada. Todos pueden entrar en cualquier momento.';
    const nGen = c.reglasGenerales.length;
    const nRol = c.reglasPorRol.length;
    const roles = new Set(c.reglasPorRol.map((r) => r.rol)).size;
    if (nRol > 0) {
      return `${roles} rol(es) con horario propio y ${nGen} horario(s) general(es) de respaldo.`;
    }
    if (nGen > 0) return `${nGen} horario(s) general(es) para todos los roles.`;
    return 'Falta definir al menos un horario antes de guardar.';
  });

  rolesConReglas = computed(() => {
    const map = new Map<string, ReglaHorarioRol[]>();
    for (const r of this.cfg().reglasPorRol) {
      const list = map.get(r.rol) || [];
      list.push(r);
      map.set(r.rol, list);
    }
    return [...map.entries()].map(([rol, ventanas]) => ({ rol, ventanas }));
  });

  ngOnInit(): void {
    this.svc.catalogos().subscribe({
      next: (c) => this.catalogos.set(c),
      error: () => this.catalogos.set(null),
    });
    this.recargar();
  }

  recargar(): void {
    this.loading.set(true);
    this.svc.obtener().subscribe({
      next: (r) => {
        this.cfg.set(r);
        this.pestanaHorarios.set(r.reglasPorRol.length ? 'porRol' : 'general');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
        this.msg.set('No se pudo cargar la configuración.');
      },
    });
  }

  guardar(): void {
    const c = this.cfg();
    if (c.activo && !c.reglasGenerales.length && !c.reglasPorRol.length) {
      this.error.set(true);
      this.msg.set('Agregue al menos un horario (general o por rol) antes de activar la restricción.');
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    this.error.set(false);
    this.svc.guardar(c).subscribe({
      next: (r) => {
        this.cfg.set(r);
        this.saving.set(false);
        this.msg.set('Configuración guardada correctamente.');
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(true);
        this.msg.set(e?.error?.message || 'Error al guardar.');
      },
    });
  }

  patch(partial: Partial<ConfigHorarioOperacion>): void {
    this.cfg.update((c) => ({ ...c, ...partial }));
  }

  agregarGeneral(): void {
    this.cfg.update((c) => ({
      ...c,
      reglasGenerales: [
        ...c.reglasGenerales,
        { id: uid('g'), dias: [1, 2, 3, 4, 5], horaInicio: '07:00', horaFin: '18:00' },
      ],
    }));
  }

  quitarGeneral(id: string): void {
    this.cfg.update((c) => ({
      ...c,
      reglasGenerales: c.reglasGenerales.filter((v) => v.id !== id),
    }));
  }

  agregarPorRol(rol?: string): void {
    const roles = this.catalogos()?.roles || [];
    const codigo = rol || roles[0]?.codigo || 'cajero';
    this.cfg.update((c) => ({
      ...c,
      reglasPorRol: [
        ...c.reglasPorRol,
        { id: uid('r'), rol: codigo, dias: [1, 2, 3, 4, 5], horaInicio: '07:00', horaFin: '18:00' },
      ],
    }));
    this.pestanaHorarios.set('porRol');
  }

  quitarPorRol(id: string): void {
    this.cfg.update((c) => ({
      ...c,
      reglasPorRol: c.reglasPorRol.filter((v) => v.id !== id),
    }));
  }

  patchGeneral(v: VentanaHorario): void {
    this.cfg.update((c) => ({
      ...c,
      reglasGenerales: c.reglasGenerales.map((x) => (x.id === v.id ? { ...v } : x)),
    }));
  }

  patchRol(v: ReglaHorarioRol): void {
    this.cfg.update((c) => ({
      ...c,
      reglasPorRol: c.reglasPorRol.map((x) => (x.id === v.id ? { ...v } : x)),
    }));
  }

  toggleDia(target: VentanaHorario | ReglaHorarioRol, dia: number, porRol: boolean): void {
    const dias = new Set(target.dias || []);
    if (dias.has(dia)) dias.delete(dia);
    else dias.add(dia);
    const next = { ...target, dias: [...dias].sort((a, b) => a - b) };
    if (porRol) this.patchRol(next as ReglaHorarioRol);
    else this.patchGeneral(next);
  }

  aplicarPresetDias(
    target: VentanaHorario | ReglaHorarioRol,
    preset: PresetDias,
    porRol: boolean,
  ): void {
    let dias: number[];
    if (preset === 'lun-vie') dias = [1, 2, 3, 4, 5];
    else if (preset === 'fin-semana') dias = [0, 6];
    else dias = [0, 1, 2, 3, 4, 5, 6];
    const next = { ...target, dias };
    if (porRol) this.patchRol(next as ReglaHorarioRol);
    else this.patchGeneral(next);
  }

  nombreRol(codigo: string): string {
    return this.catalogos()?.roles.find((r) => r.codigo === codigo)?.nombre || codigo;
  }

  etiquetaDias(dias: number[]): string {
    if (!dias?.length) return 'Sin días seleccionados';
    const sorted = [...dias].sort((a, b) => a - b);
    if (sorted.length === 7) return 'Todos los días';
    if (sorted.join(',') === '1,2,3,4,5') return 'Lunes a viernes';
    if (sorted.join(',') === '0,6') return 'Sábado y domingo';
    return sorted.map((d) => DIA_CORTO[d] || String(d)).join(', ');
  }

  resumenVentana(v: VentanaHorario): string {
    return `${this.etiquetaDias(v.dias)} · ${this.formatHora(v.horaInicio)} a ${this.formatHora(v.horaFin)}`;
  }

  indiceVentana(lista: VentanaHorario[], id: string): number {
    return lista.findIndex((v) => v.id === id) + 1;
  }

  private formatHora(hhmm: string): string {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    if (!m) return hhmm || '—';
    const h = Number(m[1]);
    const min = m[2];
    const suf = h >= 12 ? 'p. m.' : 'a. m.';
    const h12 = h % 12 || 12;
    return `${h12}:${min} ${suf}`;
  }

  diaLabel(id: number): string {
    return DIA_LABEL[id] || String(id);
  }
}
