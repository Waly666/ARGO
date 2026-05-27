import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  InspeccionItemCheck,
  InspeccionVehiculoDto,
  InspeccionVehiculoResumen,
  InspeccionVehiculoService,
} from '../../core/services/inspeccion-vehiculo.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

type ModoPanel = 'listado' | 'formulario';

@Component({
  selector: 'argo-vehiculo-inspeccion-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculo-inspeccion-panel.component.html',
  styleUrls: ['./vehiculo-inspeccion-panel.component.scss'],
})
export class VehiculoInspeccionPanelComponent implements OnChanges {
  private svc = inject(InspeccionVehiculoService);
  private auth = inject(AuthService);
  private confirm = inject(ConfirmDialogService);

  @Input({ required: true }) vehiculoId!: string;

  modo = signal<ModoPanel>('listado');
  loading = signal(false);
  loadingLista = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal<string | null>(null);
  inspeccion = signal<InspeccionVehiculoDto | null>(null);
  listado = signal<InspeccionVehiculoResumen[]>([]);
  totalListado = signal(0);
  fechaFormulario = signal<string | null>(null);

  ngOnChanges(): void {
    if (this.vehiculoId) {
      this.modo.set('listado');
      this.inspeccion.set(null);
      this.cargarListado();
    }
  }

  cargarListado(): void {
    this.loadingLista.set(true);
    this.err.set(null);
    this.svc.listar(this.vehiculoId, { limit: 100 }).subscribe({
      next: (res) => {
        this.listado.set(res.inspecciones || []);
        this.totalListado.set(res.total || 0);
        this.loadingLista.set(false);
      },
      error: (e) => {
        this.loadingLista.set(false);
        this.err.set(e?.error?.message || 'No se pudo cargar el listado de inspecciones');
      },
    });
  }

  nuevaInspeccion(): void {
    this.abrirFormulario();
  }

  abrirInspeccion(row: InspeccionVehiculoResumen): void {
    this.abrirFormulario(row.fecha);
  }

  volverListado(): void {
    this.modo.set('listado');
    this.inspeccion.set(null);
    this.fechaFormulario.set(null);
    this.msg.set(null);
    this.err.set(null);
    this.cargarListado();
  }

  abrirFormulario(fecha?: string): void {
    this.modo.set('formulario');
    this.msg.set(null);
    this.err.set(null);
    this.cargarFormulario(fecha);
  }

  cargarFormulario(fecha?: string): void {
    this.loading.set(true);
    this.inspeccion.set(null);
    this.svc.obtenerDelDia(this.vehiculoId, fecha).subscribe({
      next: (dto) => {
        this.inspeccion.set({ ...dto });
        this.fechaFormulario.set(dto.fecha);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.err.set(e?.error?.message || 'No se pudo cargar la inspección');
      },
    });
  }

  patchCampo<K extends keyof InspeccionVehiculoDto>(key: K, value: InspeccionVehiculoDto[K]): void {
    this.inspeccion.update((i) => (i ? { ...i, [key]: value } : i));
  }

  setSi(seccion: keyof InspeccionVehiculoDto, index: number, si: boolean): void {
    this.inspeccion.update((ins) => {
      if (!ins) return ins;
      const list = [...(ins[seccion] as InspeccionItemCheck[])];
      list[index] = { ...list[index], si };
      return { ...ins, [seccion]: list };
    });
  }

  setObs(seccion: keyof InspeccionVehiculoDto, index: number, observacion: string): void {
    this.inspeccion.update((ins) => {
      if (!ins) return ins;
      const list = [...(ins[seccion] as InspeccionItemCheck[])];
      list[index] = { ...list[index], observacion };
      return { ...ins, [seccion]: list };
    });
  }

  guardar(): void {
    const dto = this.inspeccion();
    if (!dto) return;
    if (!this.auth.user()?.idEmpleado) {
      this.err.set('Su usuario debe estar vinculado a un empleado en RRHH para guardar inspecciones.');
      return;
    }
    if (dto.aptoLaborar == null) {
      this.err.set('Indique si el vehículo está apto para laborar (Sí o No).');
      return;
    }
    void this.confirmarGuardado(dto);
  }

  private async confirmarGuardado(dto: InspeccionVehiculoDto): Promise<void> {
    const docsFallan = [...(dto.documentosVehiculo || []), ...(dto.documentosInstructor || [])].filter(
      (d) => d.si === false,
    );
    if (docsFallan.length) {
      const ok = await this.confirm.open({
        title: 'Documentos no al día',
        message: `Hay ${docsFallan.length} documento(s) sin cumplir. ¿Desea guardar la inspección de todas formas?`,
        variant: 'warn',
        confirmLabel: 'Guardar igual',
      });
      if (!ok) return;
    }
    this.saving.set(true);
    this.err.set(null);
    this.msg.set(null);
    this.svc.guardar(this.vehiculoId, dto).subscribe({
      next: (saved) => {
        this.inspeccion.set({ ...saved });
        this.saving.set(false);
        if (saved.avisoRolInstructor) {
          this.msg.set(`Inspección guardada. Aviso: ${saved.avisoRolInstructor}`);
        } else {
          this.msg.set('Inspección guardada.');
        }
        this.cargarListado();
      },
      error: (e) => {
        this.saving.set(false);
        this.err.set(e?.error?.message || 'Error al guardar la inspección');
      },
    });
  }

  imprimir(fecha?: string): void {
    this.svc.imprimirHtml(this.vehiculoId, fecha || this.inspeccion()?.fecha, (m) => this.err.set(m));
  }

  etiquetaApto(val?: boolean | null): string {
    if (val === true) return 'Sí';
    if (val === false) return 'No';
    return '—';
  }

  claseApto(val?: boolean | null): string {
    if (val === true) return 'ok';
    if (val === false) return 'err';
    return 'slate';
  }
}
