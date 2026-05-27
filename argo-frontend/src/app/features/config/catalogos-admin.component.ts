import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CatalogoAdminService,
  CatalogoListadoAdmin,
  CatalogoMetaItem,
} from '../../core/services/catalogo-admin.service';
import { CatalogoService } from '../../core/services/catalogo.service';
import { capEstado, capId, capTipoServ } from '../../core/utils/capsule.util';
import {
  coerceNumberInput,
  formatNumericCell,
  inputTypeForField,
  isMoneyField,
  isNumericField,
} from '../../core/utils/numeric-fields.util';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { ClaseVehiculo, VehiculoService } from '../../core/services/vehiculo.service';

interface ClaseRow {
  idClase: string;
  label: string;
}

@Component({
  selector: 'argo-catalogos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogos-admin.component.html',
  styleUrls: ['./catalogos-admin.component.scss'],
})
export class CatalogosAdminComponent implements OnInit {
  private svc = inject(CatalogoAdminService);
  private catCache = inject(CatalogoService);
  private confirm = inject(ConfirmDialogService);
  private vehSvc = inject(VehiculoService);

  catalogos = signal<CatalogoMetaItem[]>([]);
  seleccionado = signal<string | null>(null);
  listado = signal<CatalogoListadoAdmin | null>(null);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  busqueda = signal('');
  pagina = signal(0);
  readonly pageSize = 50;

  mostrarForm = signal(false);
  editandoId = signal<string | null>(null);
  formDoc = signal<Record<string, string>>({});
  clasesVehiculo = signal<ClaseRow[]>([]);
  formIdClases = signal<string[]>([]);
  formControlaVencimiento = signal(true);

  importJson = signal('');
  mostrarImport = signal(false);
  vista = signal<VistaLista>(readVistaLista('argo-catalogos-vista'));

  ngOnInit(): void {
    this.vehSvc.listarClases().subscribe({
      next: (rows) => {
        const caps = (rows || [])
          .map((r: ClaseVehiculo) => ({
            idClase: String(r.idClase ?? '').trim(),
            label: String(r.descripcion || r.idClase || '').trim(),
          }))
          .filter((c) => c.idClase);
        this.clasesVehiculo.set(caps);
      },
    });

    this.svc.meta().subscribe({
      next: (r) => {
        const list = r.catalogos || [];
        this.catalogos.set(list);
        if (list.length) {
          this.seleccionar(list[0].nombre);
        }
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error cargando catálogos'),
    });
  }

  seleccionar(nombre: string) {
    this.seleccionado.set(nombre);
    this.pagina.set(0);
    this.mostrarForm.set(false);
    this.mostrarImport.set(false);
    this.cargar();
  }

  cargar() {
    const nombre = this.seleccionado();
    if (!nombre) return;
    this.loading.set(true);
    this.svc
      .listar(nombre, {
        q: this.busqueda().trim().length >= 2 ? this.busqueda().trim() : undefined,
        skip: this.pagina() * this.pageSize,
        limit: this.pageSize,
      })
      .subscribe({
        next: (r) => {
          this.listado.set(r);
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.msg.set(e?.error?.message || 'Error cargando datos');
        },
      });
  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-catalogos-vista', v);
  }

  cardTitulo(row: Record<string, unknown>): string {
    const campos = this.camposTabla();
    if (!campos.length) return 'Registro';
    return this.valorCelda(row, campos[0]) || 'Registro';
  }

  labelActual(): string {
    const n = this.seleccionado();
    return this.catalogos().find((c) => c.nombre === n)?.label || n || '';
  }

  camposTabla(): string[] {
    const L = this.listado();
    if (!L?.campos?.length) return [];
    let campos = L.campos.filter((c) => c !== '_id');
    if (this.esCatalogoInspeccion()) {
      campos = campos.filter((c) => c !== 'claseVehiculo' && c !== 'idClases');
    }
    if (this.esCatalogoDocumento()) {
      campos = campos.filter((c) => c !== 'controlaVencimiento');
    }
    return campos.slice(0, 8);
  }

  columnasInspeccion(): string[] {
    return ['idClases', ...this.camposTabla()];
  }

  columnasDocumento(): string[] {
    return ['controlaVencimiento', ...this.camposTabla()];
  }

  columnasListado(): string[] {
    if (this.esCatalogoInspeccion()) return this.columnasInspeccion();
    if (this.esCatalogoDocumento()) return this.columnasDocumento();
    return this.camposTabla();
  }

  valorCelda(row: Record<string, unknown>, campo: string): string {
    if (campo === 'idClases') return this.formatIdClases(row[campo]);
    if (campo === 'controlaVencimiento') return this.formatControlaVencimiento(row[campo]);
    return formatNumericCell(campo, row[campo]);
  }

  formatControlaVencimiento(v: unknown): string {
    if (v === false || v === 0 || v === '0' || v === 'false' || v === 'no') return 'No vence';
    return 'Con vencimiento';
  }

  esCatalogoInspeccion(): boolean {
    const n = this.seleccionado();
    if (!n) return false;
    const meta = this.catalogos().find((c) => c.nombre === n);
    if (meta?.esInspeccionChecklist != null) return meta.esInspeccionChecklist;
    return ['itemsEstGral', 'aspecto1', 'aspecto2', 'adaptaciones'].includes(n);
  }

  esCatalogoDocumento(): boolean {
    const n = this.seleccionado();
    if (!n) return false;
    const meta = this.catalogos().find((c) => c.nombre === n);
    if (meta?.esCatalogoDocumento != null) return meta.esCatalogoDocumento;
    return n === 'itemDocumentosVehiculo' || n === 'itemDocumentosInstructores';
  }

  private parseIdClasesValor(v: unknown): string[] {
    if (v == null || v === '') return [];
    if (Array.isArray(v)) return [...new Set(v.map((c) => String(c).trim()).filter(Boolean))];
    if (typeof v === 'string') {
      const t = v.trim();
      if (!t) return [];
      if (t.startsWith('[')) {
        try {
          const parsed = JSON.parse(t);
          if (Array.isArray(parsed)) return this.parseIdClasesValor(parsed);
        } catch {
          /* ignore */
        }
      }
      return [t];
    }
    return [String(v).trim()].filter(Boolean);
  }

  formatIdClases(v: unknown): string {
    const ids = this.parseIdClasesValor(v);
    if (!ids.length) return 'Todas las clases';
    const map = new Map(this.clasesVehiculo().map((c) => [c.idClase, c.label]));
    return ids.map((id) => map.get(id) || id).join(', ');
  }

  claseMarcada(idClase: string): boolean {
    return this.formIdClases().includes(idClase);
  }

  toggleClaseItem(idClase: string, checked: boolean) {
    this.formIdClases.update((list) => {
      const set = new Set(list);
      if (checked) set.add(idClase);
      else set.delete(idClase);
      return [...set];
    });
  }

  limpiarClasesItem() {
    this.formIdClases.set([]);
  }

  private syncFormIdClases(row?: Record<string, unknown>) {
    if (!this.esCatalogoInspeccion()) {
      this.formIdClases.set([]);
      return;
    }
    if (!row) {
      this.formIdClases.set([]);
      return;
    }
    const ids = this.parseIdClasesValor(row['idClases']);
    this.formIdClases.set(ids);
  }

  private syncFormControlaVencimiento(row?: Record<string, unknown>) {
    if (!this.esCatalogoDocumento()) {
      this.formControlaVencimiento.set(true);
      return;
    }
    if (!row) {
      this.formControlaVencimiento.set(true);
      return;
    }
    const v = row['controlaVencimiento'];
    this.formControlaVencimiento.set(
      !(v === false || v === 0 || v === '0' || v === 'false' || v === 'no'),
    );
  }

  campoEsTextoLargo(campo: string): boolean {
    return ['item', 'aspecto1', 'aspecto2', 'nombre'].includes(campo);
  }

  labelCampo(campo: string): string {
    const map: Record<string, string> = {
      idItemEsGral: 'ID ítem',
      item: 'Descripción del ítem',
      idAspecto1: 'ID',
      aspecto1: 'Texto del ítem',
      idAspecto2: 'ID',
      aspecto2: 'Texto del ítem',
      idAdaptacion: 'ID',
      nombre: 'Descripción',
      idClases: 'Clases de vehículo',
      controlaVencimiento: 'Vencimiento',
    };
    return map[campo] || campo;
  }

  inputTypeCampo(campo: string): string {
    return inputTypeForField(campo);
  }

  esCampoMoneda(campo: string): boolean {
    return isMoneyField(campo);
  }

  campoEsNumerico(campo: string): boolean {
    return isNumericField(campo);
  }

  idMongo(row: Record<string, unknown>): string {
    return String(row['_id'] ?? '');
  }

  nuevo() {
    const L = this.listado();
    const campos = L?.campos?.filter((c) => c !== '_id' && c !== '__v' && c !== 'claseVehiculo' && c !== 'idClases' && c !== 'controlaVencimiento') || [];
    const doc: Record<string, string> = {};
    for (const c of campos) doc[c] = '';
    this.editandoId.set(null);
    this.formDoc.set(doc);
    this.syncFormIdClases();
    this.syncFormControlaVencimiento();
    this.mostrarForm.set(true);
    this.msg.set(null);
  }

  editar(row: Record<string, unknown>) {
    const id = this.idMongo(row);
    const campos = this.listado()?.campos?.filter((c) => c !== '_id' && c !== '__v' && c !== 'claseVehiculo' && c !== 'idClases' && c !== 'controlaVencimiento') || [];
    const doc: Record<string, string> = {};
    for (const c of campos) {
      if (c === 'idClases' || c === 'controlaVencimiento') continue;
      const v = row[c];
      doc[c] = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    this.editandoId.set(id);
    this.formDoc.set(doc);
    this.syncFormIdClases(row);
    this.syncFormControlaVencimiento(row);
    this.mostrarForm.set(true);
  }

  patchCampo(campo: string, valor: string) {
    this.formDoc.update((d) => ({ ...d, [campo]: valor }));
  }

  cancelar() {
    this.mostrarForm.set(false);
    this.editandoId.set(null);
  }

  private parseDoc(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(this.formDoc())) {
      if (k === '_id' || k === '__v' || k === 'idClases' || k === 'controlaVencimiento') continue;
      const t = v.trim();
      if (t === '') {
        out[k] = null;
        continue;
      }
      if (inputTypeForField(k) === 'number') {
        out[k] = coerceNumberInput(t);
        continue;
      }
      if (t === 'true' || t === 'false') {
        out[k] = t === 'true';
      } else if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          out[k] = JSON.parse(t);
        } catch {
          out[k] = t;
        }
      } else {
        out[k] = t;
      }
    }
    if (this.esCatalogoInspeccion()) {
      out['idClases'] = [...this.formIdClases()];
    }
    if (this.esCatalogoDocumento()) {
      out['controlaVencimiento'] = this.formControlaVencimiento();
    }
    return out;
  }

  guardar() {
    const nombre = this.seleccionado();
    if (!nombre) return;
    const doc = this.parseDoc();
    const id = this.editandoId();
    this.saving.set(true);
    const req = id ? this.svc.actualizar(nombre, id, doc) : this.svc.crear(nombre, doc);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.mostrarForm.set(false);
        this.catCache.invalidate(nombre);
        this.msg.set(id ? 'Registro actualizado.' : 'Registro creado.');
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al guardar');
      },
    });
  }

  async eliminar(row: Record<string, unknown>) {
    const nombre = this.seleccionado();
    const id = this.idMongo(row);
    if (!nombre || !id) return;
    const ok = await this.confirm.open({
      title: 'Eliminar registro',
      message: '¿Eliminar este registro del catálogo? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminar(nombre, id).subscribe({
      next: () => {
        this.catCache.invalidate(nombre);
        this.msg.set('Registro eliminado.');
        this.cargar();
      },
      error: (e) => this.msg.set(e?.error?.message || 'Error al eliminar'),
    });
  }

  toggleImport() {
    this.mostrarImport.update((v) => !v);
    this.importJson.set('');
  }

  onFileImport(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.importJson.set(String(reader.result || ''));
      input.value = '';
    };
    reader.readAsText(file);
  }

  ejecutarImport(modo: 'reemplazar' | 'agregar') {
    const nombre = this.seleccionado();
    if (!nombre) return;
    let rows: Record<string, unknown>[];
    try {
      const parsed = JSON.parse(this.importJson());
      rows = Array.isArray(parsed) ? parsed : parsed?.rows;
      if (!Array.isArray(rows)) throw new Error('Formato inválido');
    } catch {
      this.msg.set('JSON inválido. Use un arreglo de objetos o { "rows": [...] }.');
      return;
    }
    this.saving.set(true);
    this.svc.importar(nombre, rows, modo).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.mostrarImport.set(false);
        this.catCache.invalidate(nombre);
        this.msg.set(r.message || `Importados ${r.insertados} registros.`);
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al importar');
      },
    });
  }

  async recargarExcel() {
    const nombre = this.seleccionado();
    const ok = await this.confirm.open({
      title: 'Recargar desde Excel',
      message: nombre
        ? `¿Reemplazar todos los datos de «${this.labelActual()}» desde excel/catalogos.xlsx?`
        : '¿Recargar TODOS los catálogos desde excel/catalogos.xlsx? Se sobrescriben las colecciones.',
      confirmLabel: 'Recargar',
      variant: 'danger',
    });
    if (!ok) return;
    this.saving.set(true);
    this.svc.recargarExcel(nombre || undefined).subscribe({
      next: (r) => {
        this.saving.set(false);
        this.catCache.invalidate();
        this.msg.set(r.message || 'Recarga desde Excel completada.');
        this.cargar();
      },
      error: (e) => {
        this.saving.set(false);
        this.msg.set(e?.error?.message || 'Error al recargar Excel');
      },
    });
  }

  paginaAnterior() {
    if (this.pagina() <= 0) return;
    this.pagina.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente() {
    const L = this.listado();
    if (!L) return;
    if ((this.pagina() + 1) * this.pageSize >= L.total) return;
    this.pagina.update((p) => p + 1);
    this.cargar();
  }

  camposForm(): string[] {
    const L = this.listado();
    const keys = new Set(Object.keys(this.formDoc()));
    if (L?.campos?.length) {
      return L.campos.filter(
        (c) => c !== '__v' && c !== 'idClases' && c !== 'controlaVencimiento' && c !== 'claseVehiculo' && keys.has(c),
      );
    }
    return [...keys].filter((k) => k !== '_id' && k !== 'idClases' && k !== 'controlaVencimiento' && k !== 'claseVehiculo');
  }

  usarCapsula(campo: string): boolean {
    if (campo === 'idClases' || campo === 'controlaVencimiento') return false;
    return /estado|tipo|id/i.test(campo);
  }

  totalPaginas(): number {
    const L = this.listado();
    if (!L) return 0;
    return Math.max(1, Math.ceil(L.total / this.pageSize));
  }

  capParaCampo(campo: string, valor: string): string {
    const c = campo.toLowerCase();
    if (c.includes('estado') || c === 'activo') return capEstado(valor);
    if (c.includes('tiposerv') || c === 'tiposerv') return capTipoServ(valor);
    if (c.startsWith('id')) return capId(valor);
    return 'cap cap-slate cap-sm';
  }
}
