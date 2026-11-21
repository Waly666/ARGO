import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ApoyosSalida,
  EstadoSalida,
  MotivoSalida,
  RegistroSalida,
  SalidaRetornoService,
} from '../../core/services/salida-retorno.service';

interface FormSalida {
  placa: string;
  idEmpleadoConductor: string;
  motivo: MotivoSalida;
  claseId: string;
  alumnoNumDoc: string;
  origen: string;
  destino: string;
  fechaHoraSalida: string;
  kilometrajeInicial: string;
  inspeccionId: string;
  fechaHoraRegreso: string;
  kilometrajeFinal: string;
  observaciones: string;
  incidente: string;
  estado: EstadoSalida;
}

const VACIO: FormSalida = {
  placa: '',
  idEmpleadoConductor: '',
  motivo: 'clase',
  claseId: '',
  alumnoNumDoc: '',
  origen: 'CEA',
  destino: '',
  fechaHoraSalida: '',
  kilometrajeInicial: '',
  inspeccionId: '',
  fechaHoraRegreso: '',
  kilometrajeFinal: '',
  observaciones: '',
  incidente: '',
  estado: 'programado',
};

@Component({
  selector: 'app-salida-retorno',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './salida-retorno.component.html',
  styleUrl: './salida-retorno.component.scss',
})
/** Evidencia del desplazamiento. La inspección preoperacional es otro control. */
export class SalidaRetornoComponent implements OnInit {
  private readonly api = inject(SalidaRetornoService);
  /** Si viene de la ficha del vehículo, el registro queda fijo a esa placa. */
  readonly placaFija = input('');

  readonly items = signal<RegistroSalida[]>([]);
  readonly apoyos = signal<ApoyosSalida>({ vehiculos: [], conductores: [], clases: [], inspecciones: [], alumnos: [] });
  readonly filtro = signal('');
  readonly editando = signal<string | null>(null);
  readonly abierto = signal(false);
  readonly form = signal<FormSalida>({ ...VACIO });
  readonly error = signal('');
  readonly aviso = signal('');
  readonly guardando = signal(false);

  readonly motivos: { id: MotivoSalida; label: string }[] = [
    { id: 'clase', label: 'Clase práctica' },
    { id: 'mantenimiento', label: 'Mantenimiento' },
    { id: 'diligencia', label: 'Diligencia' },
    { id: 'otro', label: 'Otro' },
  ];
  readonly estados: { id: EstadoSalida; label: string }[] = [
    { id: 'programado', label: 'Programado' },
    { id: 'autorizado', label: 'Autorizado' },
    { id: 'en_curso', label: 'En curso' },
    { id: 'finalizado', label: 'Finalizado' },
    { id: 'cancelado', label: 'Cancelado' },
  ];

  ngOnInit(): void {
    this.cargar();
    this.cargarApoyos();
  }

  km(): number | null {
    const a = Number(this.form().kilometrajeInicial);
    const b = Number(this.form().kilometrajeFinal);
    if (!Number.isFinite(a) || !Number.isFinite(b) || this.form().kilometrajeFinal === '') return null;
    return b - a;
  }

  etiquetaEstado(id: string): string {
    return this.estados.find((e) => e.id === id)?.label || id;
  }

  etiquetaMotivo(id: string): string {
    return this.motivos.find((m) => m.id === id)?.label || id;
  }

  cargar(): void {
    this.api.listar(this.filtro(), this.placaFija()).subscribe({
      next: (r) => this.items.set(r.items || []),
      error: () => this.error.set('No se pudo cargar el registro de salidas.'),
    });
  }

  cargarApoyos(): void {
    const f = this.form();
    const fecha = (f.fechaHoraSalida || '').slice(0, 10);
    this.api.apoyos(f.placa, fecha, f.motivo === 'clase' ? f.claseId : '').subscribe({
      next: (r) => this.apoyos.set(r),
      error: () => this.error.set('No se pudieron cargar vehículos, conductores o clases.'),
    });
  }

  nuevo(): void {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    this.editando.set(null);
    this.form.set({ ...VACIO, placa: this.placaFija(), fechaHoraSalida: local, estado: 'en_curso' });
    this.error.set('');
    this.aviso.set('');
    this.abierto.set(true);
    this.cargarApoyos();
  }

  editar(item: RegistroSalida): void {
    this.editando.set(item._id);
    this.form.set({
      placa: item.placa,
      idEmpleadoConductor: String(item.idEmpleadoConductor || ''),
      motivo: item.motivo,
      claseId: item.claseId || '',
      alumnoNumDoc: item.alumnoNumDoc != null ? String(item.alumnoNumDoc) : '',
      origen: item.origen || '',
      destino: item.destino || '',
      fechaHoraSalida: this.aLocal(item.fechaHoraSalida),
      kilometrajeInicial: item.kilometrajeInicial != null ? String(item.kilometrajeInicial) : '',
      inspeccionId: item.inspeccionId || '',
      fechaHoraRegreso: this.aLocal(item.fechaHoraRegreso),
      kilometrajeFinal: item.kilometrajeFinal != null ? String(item.kilometrajeFinal) : '',
      observaciones: item.observaciones || '',
      incidente: item.incidente || '',
      estado: item.estado,
    });
    this.error.set('');
    this.aviso.set('');
    this.abierto.set(true);
    this.cargarApoyos();
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  patch(parcial: Partial<FormSalida>): void {
    const anterior = this.form();
    const siguiente = { ...anterior, ...parcial };
    if (parcial.motivo && parcial.motivo !== 'clase') {
      siguiente.claseId = '';
      siguiente.alumnoNumDoc = '';
    }
    if (parcial.placa && parcial.placa !== anterior.placa) {
      siguiente.claseId = '';
      siguiente.alumnoNumDoc = '';
      siguiente.inspeccionId = '';
    }
    this.form.set(siguiente);
    if (parcial.placa != null || parcial.fechaHoraSalida != null || parcial.claseId != null || parcial.motivo != null) {
      this.cargarApoyos();
    }
  }

  registrarRetorno(): void {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    this.patch({ fechaHoraRegreso: this.form().fechaHoraRegreso || local, estado: 'finalizado' });
  }

  guardar(): void {
    if (this.placaFija()) {
      this.form.update((actual) => ({ ...actual, placa: this.placaFija() }));
    }
    const f = this.form();
    this.error.set('');
    this.aviso.set('');
    if (!f.placa || !f.idEmpleadoConductor) {
      this.error.set(this.placaFija() ? 'Seleccione el conductor.' : 'Seleccione el vehículo y el conductor.');
      return;
    }
    if (f.motivo === 'clase' && !f.claseId) {
      this.error.set('Enlace la clase práctica. El alumno se toma de esa clase.');
      return;
    }
    this.guardando.set(true);
    const body = {
      ...f,
      idEmpleadoConductor: Number(f.idEmpleadoConductor),
      alumnoNumDoc: f.alumnoNumDoc ? Number(f.alumnoNumDoc) : '',
      kilometrajeInicial: f.kilometrajeInicial === '' ? '' : Number(f.kilometrajeInicial),
      kilometrajeFinal: f.kilometrajeFinal === '' ? '' : Number(f.kilometrajeFinal),
    };
    const req = this.editando()
      ? this.api.actualizar(this.editando()!, body)
      : this.api.crear(body);
    req.subscribe({
      next: () => {
        this.guardando.set(false);
        this.abierto.set(false);
        this.aviso.set(this.editando() ? 'Desplazamiento actualizado.' : 'Salida registrada.');
        this.cargar();
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(e?.error?.message || 'No se pudo guardar el registro.');
      },
    });
  }

  private aLocal(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}


