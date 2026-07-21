import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { RrhhCatalogService } from '../../core/services/rrhh-catalog.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';
import { formatMoneyValue, parseMoneyValue } from '../../core/utils/money.helpers';
import { catalogConfigByTab, RRHH_CATALOG_TABS } from './rrhh-catalog.config';
import { RrhhCatalogConfig, RrhhCatalogField } from './rrhh-catalog.types';

@Component({
  selector: 'argo-rrhh-catalog-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './rrhh-catalog-admin.component.html',
  styleUrls: [
    './rrhh-catalog-admin.component.scss',
    './rrhh-catalog-tabs.component.scss',
    './rrhh-shared.scss',
  ],
})
export class RrhhCatalogAdminComponent implements OnInit {
  private svc = inject(RrhhCatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirm = inject(ConfirmDialogService);

  readonly catalogTabs = RRHH_CATALOG_TABS;
  tabActivo = signal('cargos');

  config = signal<RrhhCatalogConfig | null>(null);
  rows = signal<Record<string, unknown>[]>([]);
  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgError = signal(false);
  busqueda = signal('');
  vista = signal<VistaLista>(readVistaLista('argo-rrhh-catalog-vista'));
  editando = signal<Record<string, unknown> | null>(null);
  mostrarForm = signal(false);
  form = signal<Record<string, unknown>>({});
  /** Cargos del catálogo RRHH (para ámbito de competencias). */
  cargos = signal<{ idCargo: number; nombre: string }[]>([]);
  /** Modo de ámbito en el formulario de competencias. */
  ambitoModo = signal<'todos' | 'especifico'>('todos');

  ngOnInit(): void {
    this.route.paramMap.subscribe((pm) => {
      const tab = pm.get('tab');
      const legacy = this.route.snapshot.data['catalogConfig'] as RrhhCatalogConfig | undefined;
      const cfg = tab ? catalogConfigByTab(tab) : legacy;
      if (!cfg) {
        this.router.navigate(['/app/rrhh/catalogos', 'cargos'], { replaceUrl: true });
        return;
      }
      this.tabActivo.set(tab || 'cargos');
      this.mostrarForm.set(false);
      this.config.set(cfg);
      if (cfg.fields.some((f) => f.type === 'cargos-multiselect')) {
        this.cargarCargos();
      }
      this.cargar();
    });
  }

  private cargarCargos(): void {
    this.svc.listar<{ idCargo: number; nombre: string; estado?: string }>('cargos', { activos: false }).subscribe({
      next: (r) => {
        const list = (r || [])
          .filter((c) => String(c.estado || 'activo').toLowerCase() !== 'inactivo')
          .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
        this.cargos.set(list.map((c) => ({ idCargo: Number(c.idCargo), nombre: c.nombre })));
      },
      error: () => this.cargos.set([]),
    });
  }

  tabsOrganizacion() {
    return this.catalogTabs.filter((t) => t.grupo === 'organizacion');
  }

  tabsSeguridad() {
    return this.catalogTabs.filter((t) => t.grupo === 'seguridad');
  }

  cargar() {
    const cfg = this.config();
    if (!cfg) return;
    this.loading.set(true);
    const q = this.busqueda().trim();
    this.svc.listar<Record<string, unknown>>(cfg.apiPath, q.length >= 2 ? { q } : {}).subscribe({
      next: (r) => {
        this.rows.set(r || []);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.inform(e?.error?.message || 'Error al cargar', true);
      },
    });
  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-rrhh-catalog-vista', v);
  }

  cardTitulo(row: Record<string, unknown>): string {
    const cfg = this.config();
    if (!cfg) return '—';
    const key = cfg.labelKey || cfg.columns[0]?.key || 'nombre';
    return this.cell(row, key);
  }

  nuevo() {
    const cfg = this.config()!;
    const f: Record<string, unknown> = { estado: 'activo' };
    for (const field of cfg.fields) {
      if (field.key === 'estado') continue;
      if (field.type === 'cargos-multiselect') f[field.key] = [];
      else f[field.key] = '';
    }
    this.form.set(f);
    this.ambitoModo.set('todos');
    this.editando.set(null);
    this.mostrarForm.set(true);
    this.inform(null);
  }

  editar(row: Record<string, unknown>) {
    const cfg = this.config()!;
    const f: Record<string, unknown> = {};
    for (const field of cfg.fields) {
      f[field.key] = this.fieldValueFromRow(row, field);
    }
    this.form.set(f);
    const ids = f['cargosIds'];
    this.ambitoModo.set(Array.isArray(ids) && ids.length > 0 ? 'especifico' : 'todos');
    this.editando.set(row);
    this.mostrarForm.set(true);
    this.inform(null);
  }

  patch(key: string, value: unknown) {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  ambitoEsTodos(): boolean {
    return this.ambitoModo() === 'todos';
  }

  setAmbitoTodos(todos: boolean): void {
    if (todos) {
      this.ambitoModo.set('todos');
      this.patch('cargosIds', []);
    } else {
      this.ambitoModo.set('especifico');
    }
  }

  cargoChecked(idCargo: number): boolean {
    const ids = this.form()['cargosIds'];
    if (!Array.isArray(ids)) return false;
    return ids.some((x) => Number(x) === Number(idCargo));
  }

  toggleCargo(idCargo: number, checked: boolean): void {
    this.ambitoModo.set('especifico');
    const cur = this.form()['cargosIds'];
    const list = Array.isArray(cur) ? cur.map(Number) : [];
    const id = Number(idCargo);
    const next = checked
      ? [...new Set([...list.filter((n) => Number.isFinite(n)), id])]
      : list.filter((n) => n !== id);
    this.patch('cargosIds', next);
  }

  guardar() {
    const cfg = this.config()!;
    const f = this.form();
    for (const field of cfg.fields) {
      if (!field.required) continue;
      if (field.type === 'cargos-multiselect') continue;
      if (!String(f[field.key] ?? '').trim()) {
        this.inform(`${field.label} es obligatorio.`, true);
        return;
      }
    }
    if (this.ambitoModo() === 'especifico') {
      const ids = f['cargosIds'];
      if (!Array.isArray(ids) || !ids.length) {
        this.inform('Seleccione al menos un cargo, o marque «Todos los cargos».', true);
        return;
      }
    }
    this.saving.set(true);
    const ed = this.editando();
    const id = ed?.[cfg.idKey] as number | string;
    const payload = this.payloadForApi(cfg.fields, f);
    const req = ed
      ? this.svc.actualizar(cfg.apiPath, id, payload)
      : this.svc.crear(cfg.apiPath, payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.mostrarForm.set(false);
        this.cargar();
        this.inform(ed ? 'Actualizado.' : 'Creado.');
      },
      error: (e) => {
        this.saving.set(false);
        this.inform(e?.error?.message || 'Error al guardar', true);
      },
    });
  }

  async eliminar(row: Record<string, unknown>) {
    const cfg = this.config()!;
    const label = row[cfg.labelKey || 'nombre'] || row[cfg.idKey];
    const ok = await this.confirm.open({
      title: `Eliminar ${cfg.titulo}`,
      message: `¿Eliminar ${label}?`,
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!ok) return;
    this.svc.eliminar(cfg.apiPath, row[cfg.idKey] as number).subscribe({
      next: () => {
        this.cargar();
        this.inform('Eliminado.');
      },
      error: (e) => this.inform(e?.error?.message || 'No se pudo eliminar', true),
    });
  }

  cancelar() {
    this.mostrarForm.set(false);
    this.editando.set(null);
  }

  private inform(text: string | null, isErr = false): void {
    this.msg.set(text);
    this.msgError.set(isErr);
  }

  cell(row: Record<string, unknown>, key: string): string {
    const cfg = this.config();
    const field = cfg?.fields.find((f) => f.key === key);
    if (field?.type === 'cargos-multiselect' || key === 'cargosIds') {
      return this.labelAmbito(row);
    }
    if (field?.type === 'number' || /^salario/i.test(key)) {
      return formatMoneyValue(row[key]);
    }
    const v = row[key];
    if (v == null || v === '') return '—';
    return String(v);
  }

  labelAmbito(row: Record<string, unknown>): string {
    const ids = Array.isArray(row['cargosIds'])
      ? (row['cargosIds'] as unknown[]).map(Number).filter((n) => Number.isFinite(n))
      : [];
    if (!ids.length) {
      const legacy = String(row['ambito'] || '').toLowerCase();
      if (legacy && legacy !== 'todos' && legacy !== 'general' && legacy !== 'cargos') {
        return legacy.charAt(0).toUpperCase() + legacy.slice(1);
      }
      return 'Todos';
    }
    const map = new Map(this.cargos().map((c) => [Number(c.idCargo), c.nombre]));
    const names = ids.map((id) => map.get(id) || `#${id}`);
    return names.join(', ');
  }

  private fieldValueFromRow(row: Record<string, unknown>, field: RrhhCatalogField): unknown {
    const raw = row[field.key];
    if (field.type === 'cargos-multiselect') {
      if (Array.isArray(raw)) return raw.map(Number).filter((n) => Number.isFinite(n));
      return [];
    }
    if (field.type === 'number') {
      const n = parseMoneyValue(raw);
      return n == null ? '' : n;
    }
    return raw ?? '';
  }

  private payloadForApi(fields: RrhhCatalogField[], form: Record<string, unknown>): Record<string, unknown> {
    const out = { ...form };
    for (const field of fields) {
      if (field.type === 'cargos-multiselect') {
        const ids =
          this.ambitoModo() === 'todos'
            ? []
            : Array.isArray(out[field.key])
              ? (out[field.key] as unknown[]).map(Number).filter((n) => Number.isFinite(n) && n > 0)
              : [];
        out[field.key] = [...new Set(ids)];
        out['ambito'] = ids.length ? 'cargos' : 'todos';
        continue;
      }
      if (field.type !== 'number') continue;
      const n = parseMoneyValue(out[field.key]);
      out[field.key] = n == null ? null : n;
    }
    return out;
  }
}
