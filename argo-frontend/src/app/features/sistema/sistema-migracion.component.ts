import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  HojaMigracion,
  LoteMigracion,
  ReporteValidacion,
  ResultadoImportacion,
  SistemaService,
} from '../../core/services/sistema.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

interface OpcionHoja {
  clave: HojaMigracion;
  etiqueta: string;
  detalle: string;
}

@Component({
  selector: 'argo-sistema-migracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sistema-migracion.component.html',
  styleUrls: ['./sistema-migracion.component.scss'],
})
export class SistemaMigracionComponent implements OnInit {
  private svc = inject(SistemaService);
  private confirm = inject(ConfirmDialogService);

  /** Qué migrar: dinámico según lo que entregue cada cliente. */
  readonly opcionesHojas: OpcionHoja[] = [
    { clave: 'programas', etiqueta: 'Programas y servicios', detalle: 'Catálogo de programas con sus tarifas (se crean si no existen)' },
    { clave: 'alumnos', etiqueta: 'Alumnos', detalle: 'Datos personales y de contacto' },
    { clave: 'matriculas', etiqueta: 'Matrículas y saldos', detalle: 'Ligados al programa y su servicio: valor, pagado y saldo pendiente' },
    { clave: 'pagos', etiqueta: 'Pagos históricos', detalle: 'Recibos del sistema anterior' },
    { clave: 'certificados', etiqueta: 'Certificados', detalle: 'Certificados ya emitidos' },
  ];
  seleccion = signal<Record<HojaMigracion, boolean>>({
    programas: true,
    alumnos: true,
    matriculas: true,
    pagos: true,
    certificados: true,
  });

  archivo = signal<File | null>(null);
  reporte = signal<ReporteValidacion | null>(null);
  resultado = signal<ResultadoImportacion | null>(null);
  lotes = signal<LoteMigracion[]>([]);
  validando = signal(false);
  importando = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);

  actualizarExistentes = false;

  ngOnInit(): void {
    this.cargarLotes();
  }

  private toast(texto: string, esError = false) {
    this.msg.set(texto);
    this.msgError.set(esError);
    if (!esError) setTimeout(() => this.msg.set(null), 6000);
  }

  cargarLotes() {
    this.svc.lotesMigracion().subscribe({
      next: (l) => this.lotes.set(l),
      error: () => {},
    });
  }

  hojasSeleccionadas(): HojaMigracion[] {
    const sel = this.seleccion();
    return this.opcionesHojas.filter((o) => sel[o.clave]).map((o) => o.clave);
  }

  haySeleccion(): boolean {
    return this.hojasSeleccionadas().length > 0;
  }

  estaSeleccionada(clave: HojaMigracion): boolean {
    return this.seleccion()[clave];
  }

  toggleHoja(clave: HojaMigracion, valor: boolean) {
    this.seleccion.update((s) => ({ ...s, [clave]: valor }));
    // La selección cambia lo que se valida e importa: invalida el reporte anterior.
    this.reporte.set(null);
    this.resultado.set(null);
  }

  descargarPlantilla() {
    this.svc.descargarPlantilla(this.hojasSeleccionadas()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-migracion-argo.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast('No se pudo descargar la plantilla', true),
    });
  }

  onArchivo(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0] || null;
    this.archivo.set(file);
    this.reporte.set(null);
    this.resultado.set(null);
  }

  validar() {
    const file = this.archivo();
    if (!file || !this.haySeleccion()) return;
    this.validando.set(true);
    this.reporte.set(null);
    this.resultado.set(null);
    this.svc.validarMigracion(file, this.hojasSeleccionadas()).subscribe({
      next: (r) => {
        this.validando.set(false);
        this.reporte.set(r);
        if (r.errores.length) {
          this.toast(`Validación con ${r.errores.length} error(es). Corrija el archivo o importe solo las filas válidas.`, true);
        } else {
          this.toast('Archivo válido: puede importar.');
        }
      },
      error: (e) => {
        this.validando.set(false);
        this.toast(e?.error?.message || 'No se pudo validar el archivo', true);
      },
    });
  }

  totalValidos(): number {
    const r = this.reporte();
    if (!r) return 0;
    return this.hojasSeleccionadas().reduce((s, h) => s + (r.validos[h] || 0), 0);
  }

  etiquetaHoja(clave: HojaMigracion): string {
    return this.opcionesHojas.find((o) => o.clave === clave)?.etiqueta || clave;
  }

  async importar() {
    const file = this.archivo();
    const rep = this.reporte();
    if (!file || !rep) return;

    const conErrores = rep.errores.length
      ? ` Las ${rep.errores.length} filas con error se omitirán.`
      : '';
    const tipos = this.hojasSeleccionadas()
      .map((h) => this.etiquetaHoja(h).toLowerCase())
      .join(', ');
    const ok = await this.confirm.open({
      title: 'Importar datos',
      message:
        `Se importarán ${this.totalValidos()} registros (${tipos}).` +
        `${conErrores} ¿Continuar?`,
      variant: 'warn',
      confirmLabel: 'Sí, importar',
    });
    if (!ok) return;

    this.importando.set(true);
    this.svc.importarMigracion(file, this.hojasSeleccionadas(), this.actualizarExistentes).subscribe({
      next: (r) => {
        this.importando.set(false);
        this.resultado.set(r);
        this.archivo.set(null);
        this.reporte.set(null);
        this.toast(`Importación ${r.lote} completada.`);
        this.cargarLotes();
      },
      error: (e) => {
        this.importando.set(false);
        this.toast(e?.error?.message || 'La importación falló', true);
      },
    });
  }
}
