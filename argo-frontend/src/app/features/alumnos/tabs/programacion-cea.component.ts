import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import {
  FilaRastreoCea,
  ProgramacionCeaService,
  labelOrigenHorasCea,
  labelTipoHorasCea,
} from '../../../core/services/programacion-cea.service';

@Component({
  selector: 'argo-alumno-programacion-cea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './programacion-cea.component.html',
  styleUrls: ['./programacion-cea.component.scss'],
})
export class AlumnoProgramacionCeaComponent implements OnInit {
  private svc = inject(ProgramacionCeaService);
  private store = inject(AlumnoStore);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  filas = signal<FilaRastreoCea[]>([]);
  alumnoNombre = signal('');

  pendientesCount = computed(() => this.filas().filter((f) => f.pendientes > 0).length);
  totalPendientes = computed(() =>
    this.filas().reduce((acc, f) => acc + Math.max(0, Number(f.pendientes) || 0), 0),
  );

  labelTipo = labelTipoHorasCea;
  labelOrigen = labelOrigenHorasCea;

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    const nd = this.store.numDoc();
    if (nd == null) {
      this.filas.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.svc.rastreoAlumno(nd).subscribe({
      next: (r) => {
        this.filas.set(r.filas || []);
        this.alumnoNombre.set(r.alumnoNombre || this.store.nombreCompleto() || '');
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.message || 'No se pudo cargar el rastreo CEA.');
        this.filas.set([]);
      },
    });
  }

  irProgramacion() {
    void this.router.navigate(['/app/programacion-cea'], { queryParams: { tab: 'clases' } });
  }

  irPendientes() {
    void this.router.navigate(['/app/programacion-cea'], { queryParams: { tab: 'pendientes' } });
  }
}
