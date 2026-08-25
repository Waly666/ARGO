import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'argo-sistema-horario-operacion',
  standalone: true,
  imports: [CommonModule, FormsModule, BackupResetRestoreNavComponent],
  templateUrl: './sistema-horario-operacion.component.html',
  styleUrls: ['./sistema-horario-operacion.component.scss', './sistema-shared.scss'],
})
export class SistemaHorarioOperacionComponent implements OnInit {
  private svc = inject(ConfigHorarioOperacionService);

  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  error = signal(false);
  catalogos = signal<HorarioOperacionCatalogos | null>(null);

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
    this.saving.set(true);
    this.msg.set(null);
    this.error.set(false);
    this.svc.guardar(this.cfg()).subscribe({
      next: (r) => {
        this.cfg.set(r);
        this.saving.set(false);
        this.msg.set('Configuración guardada.');
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

  agregarPorRol(): void {
    const roles = this.catalogos()?.roles || [];
    const rol = roles[0]?.codigo || 'cajero';
    this.cfg.update((c) => ({
      ...c,
      reglasPorRol: [
        ...c.reglasPorRol,
        { id: uid('r'), rol, dias: [1, 2, 3, 4, 5], horaInicio: '07:00', horaFin: '18:00' },
      ],
    }));
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
      reglasGenerales: c.reglasGenerales.map((x) => (x.id === v.id ? v : x)),
    }));
  }

  patchRol(v: ReglaHorarioRol): void {
    this.cfg.update((c) => ({
      ...c,
      reglasPorRol: c.reglasPorRol.map((x) => (x.id === v.id ? v : x)),
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

  nombreRol(codigo: string): string {
    return this.catalogos()?.roles.find((r) => r.codigo === codigo)?.nombre || codigo;
  }
}
