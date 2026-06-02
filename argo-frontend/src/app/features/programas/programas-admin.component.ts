import { CommonModule } from '@angular/common';

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';



import { CatalogoService } from '../../core/services/catalogo.service';

import {

  Programa,

  ProgramaDto,

  ProgramaService,

  ServicioPrograma,

} from '../../core/services/programa.service';

import { AuthService } from '../../core/services/auth.service';
import { PermisoService } from '../../core/services/permiso.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import {
  ConfigCertificado,
  ConfigCertificadoService,
  PlantillaCertificado,
} from '../../core/services/config-certificado.service';
import {
  TIPOS_CERTIFICADO,
  TipoCertificadoId,
  labelOrientacion,
  labelTipoCert,
} from '../../core/constants/tipos-certificado';

import {
  capCodigo,
  capEstado,
  capHoras,
  capMoneda,
  capTipoCapLabel,
} from '../../core/utils/capsule.util';
import { coerceProgramaNumeric } from '../../core/utils/programa-numeric.util';
import { readVistaLista, saveVistaLista, VistaLista } from '../../core/utils/vista-lista.helpers';

type SortColPrograma =
  | 'codigo'
  | 'programa'
  | 'certificado'
  | 'formatoCert'
  | 'tipo'
  | 'horas'
  | 'semestres'
  | 'matricula'
  | 'estado';
type SortDir = 'asc' | 'desc';

const SORT_STORAGE_KEY = 'argo-programas-sort';

const SORT_COLUMNS: ReadonlyArray<{ key: SortColPrograma; label: string }> = [
  { key: 'codigo', label: 'Código' },
  { key: 'programa', label: 'Programa' },
  { key: 'certificado', label: 'Certificado' },
  { key: 'formatoCert', label: 'Formato cert.' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'horas', label: 'Horas' },
  { key: 'semestres', label: 'Sem.' },
  { key: 'matricula', label: 'Matrícula' },
  { key: 'estado', label: 'Estado' },
];

function readSortPrefs(): { col: SortColPrograma; dir: SortDir } {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return { col: 'programa', dir: 'asc' };
    const parsed = JSON.parse(raw) as { col?: string; dir?: string };
    const col = SORT_COLUMNS.some((c) => c.key === parsed.col) ? (parsed.col as SortColPrograma) : 'programa';
    const dir: SortDir = parsed.dir === 'desc' ? 'desc' : 'asc';
    return { col, dir };
  } catch {
    return { col: 'programa', dir: 'asc' };
  }
}

function saveSortPrefs(col: SortColPrograma, dir: SortDir): void {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ col, dir }));
  } catch {
    /* ignore */
  }
}

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });
}

function cmpNum(a: number | null | undefined, b: number | null | undefined): number {
  const na = a == null || Number.isNaN(Number(a)) ? null : Number(a);
  const nb = b == null || Number.isNaN(Number(b)) ? null : Number(b);
  if (na == null && nb == null) return 0;
  if (na == null) return 1;
  if (nb == null) return -1;
  return na - nb;
}

import { FormModalComponent } from '../../shared/form-modal/form-modal.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
interface AuditInfo {

  fechaAudi?: string;

  userAddReg?: string;

  userChangeRecord?: string;

  fechaMod?: string;

}



@Component({

  selector: 'argo-programas-admin',

  standalone: true,

  imports: [CommonModule, FormsModule, FormModalComponent, CatalogoEnumBuscarComponent],

  templateUrl: './programas-admin.component.html',

  styleUrls: ['./programas-admin.component.scss'],

})

export class ProgramasAdminComponent implements OnInit {

  private progSvc = inject(ProgramaService);

  private catSvc = inject(CatalogoService);

  private auth = inject(AuthService);
  private permisoSvc = inject(PermisoService);

  private cfgCertSvc = inject(ConfigCertificadoService);

  private confirm = inject(ConfirmDialogService);



  programas = signal<Programa[]>([]);

  sortColumns = SORT_COLUMNS;
  sortCol = signal<SortColPrograma>('programa');
  sortDir = signal<SortDir>('asc');

  programasOrdenados = computed(() => {
    const rows = [...this.programas()];
    const col = this.sortCol();
    const dir = this.sortDir();
    const mul = dir === 'asc' ? 1 : -1;

    rows.sort((a, b) => {
      let c = 0;
      switch (col) {
        case 'codigo':
          c = cmpStr(String(a.codigoProg || a.idPrograma || ''), String(b.codigoProg || b.idPrograma || ''));
          break;
        case 'programa':
          c = cmpStr(a.nombreProg || '', b.nombreProg || '');
          break;
        case 'certificado':
          c = cmpStr(a.nomCert || '', b.nomCert || '');
          break;
        case 'formatoCert': {
          const fa = a.tipoCertificado ? labelTipoCert(a.tipoCertificado) : 'Automático';
          const fb = b.tipoCertificado ? labelTipoCert(b.tipoCertificado) : 'Automático';
          c = cmpStr(fa, fb);
          break;
        }
        case 'tipo':
          c = cmpStr(this.labelTipo(a.idTipCap), this.labelTipo(b.idTipCap));
          break;
        case 'horas':
          c = cmpNum(a.horas, b.horas);
          break;
        case 'semestres':
          c = cmpNum(a.semestres, b.semestres);
          break;
        case 'matricula':
          c = cmpNum(a.valorMatricula, b.valorMatricula);
          break;
        case 'estado':
          c = cmpStr(a.estado || '', b.estado || '');
          break;
      }
      if (c !== 0) return c * mul;
      return cmpStr(a.nombreProg || '', b.nombreProg || '') * mul;
    });

    return rows;
  });

  tiposCap = signal<{ id: string | number; label: string }[]>([]);

  tiposServ = signal<{ id: number; code: string; label: string }[]>([]);

  tiposCert = TIPOS_CERTIFICADO;

  configCert = signal<ConfigCertificado | null>(null);

  plantillasCert = signal<PlantillaCertificado[]>([]);

  loading = signal(false);

  saving = signal(false);

  msg = signal<string | null>(null);

  busqueda = signal('');

  vista = signal<VistaLista>(readVistaLista('argo-programas-vista'));

  modalAbierto = signal(false);

  editando = signal<Programa | null>(null);

  servicioVinculado = signal<ServicioPrograma | null>(null);
  serviciosVinculados = signal<ServicioPrograma[]>([]);
  servicioHoraPractica = signal<ServicioPrograma | null>(null);

  auditPrograma = signal<AuditInfo | null>(null);

  auditServicio = signal<AuditInfo | null>(null);

  tiposCargando = signal(true);

  esAdmin = signal(false);

  puedeAgregarPrograma(): boolean {
    return this.permisoSvc.tiene(['programas.agregar', 'programas.gestionar']);
  }

  puedeGestionarPrograma(): boolean {
    return this.permisoSvc.tiene('programas.gestionar');
  }



  form = signal<ProgramaDto>(this.formVacio());

  opcionesTipoCertificado = computed<EnumBuscarOption[]>(() => [
    { value: '', label: 'Automático' },
    ...TIPOS_CERTIFICADO.map((t) => ({ value: t.id, label: t.label })),
  ]);

  textoTipoCertificado = computed(() => {
    const v = this.form().tipoCertificado;
    if (v == null || v === '') return 'Automático';
    return labelTipoCert(v);
  });

  opcionesTipoCap = computed<EnumBuscarOption[]>(() =>
    this.tiposCap().map((t) => ({ value: t.id, label: t.label })),
  );

  textoTipoCap = computed(() => this.labelTipo(this.form().idTipCap));

  opcionesEstado: EnumBuscarOption[] = [
    { value: 'ACTIVO', label: 'ACTIVO' },
    { value: 'INACTIVO', label: 'INACTIVO' },
  ];

  textoEstado = computed(() => this.form().estado || 'ACTIVO');

  opcionesTipoServ = computed<EnumBuscarOption[]>(() =>
    this.tiposServ().map((t) => ({
      value: t.code,
      label: `${t.label} (${t.code})`,
    })),
  );

  textoTipoServ = computed(() => {
    const code = this.form().tipoServ;
    const t = this.tiposServ().find((x) => x.code === code);
    return t ? `${t.label} (${t.code})` : String(code || '');
  });

  opcionesFacturar: EnumBuscarOption[] = [
    { value: 'NO', label: 'NO' },
    { value: 'SI', label: 'SI' },
  ];

  textoFacturar = computed(() => this.form().facturar || 'NO');

  ngOnInit(): void {

    const sortPrefs = readSortPrefs();
    this.sortCol.set(sortPrefs.col);
    this.sortDir.set(sortPrefs.dir);

    const r = String(this.auth.user()?.rol || '').toLowerCase();

    this.esAdmin.set(r === 'admin' || r.includes('admin'));

    this.cargar();

    this.cfgCertSvc.obtener().subscribe({ next: (c) => this.configCert.set(c) });

    this.cfgCertSvc.listarPlantillasTodas().subscribe({

      next: (r) => this.plantillasCert.set(r || []),

    });

    this.catSvc.list('catTipoCapacitacion').subscribe({

      next: (rows) => {

        this.tiposCargando.set(false);

        const list: { id: string | number; label: string }[] = (rows || []).map(

          (t: { idTipCap?: string | number; tipoCap?: string }) => {

            const raw = t.idTipCap ?? t.tipoCap ?? '';

            const id: string | number =

              typeof raw === 'number' || typeof raw === 'string' ? raw : String(raw);

            return { id, label: String(t.tipoCap ?? t.idTipCap ?? '') };

          },

        );

        this.tiposCap.set(list);

        if (!list.length) {

          this.msg.set('No hay tipos de capacitación en el catálogo. Ejecute el seed de catálogos.');

        }

      },

      error: () => {

        this.tiposCargando.set(false);

        this.msg.set('No se pudieron cargar los tipos de capacitación.');

      },

    });

    this.catSvc.list('catTipServicio').subscribe({

      next: (rows) => {

        const list = (rows || []).map(

          (t: { idTipoServ?: number; tipoServ?: string; descTipoServ?: string }) => ({

            id: Number(t.idTipoServ) || 0,

            code: String(t.tipoServ || '').trim(),

            label: String(t.descTipoServ || t.tipoServ || ''),

          }),

        );

        this.tiposServ.set(list.filter((x) => x.code));

      },

    });

  }



  private formVacio(): ProgramaDto {

    return {

      nombreProg: '',

      nomCert: '',

      idTipCap: '' as string | number,

      semestres: null,

      horas: null,

      horasTeoria: null,

      horasPractica: null,

      horasTaller: null,

      valorMatricula: 0,

      tarifa1: 0,

      tarifa2: 0,

      tarifa3: 0,

      diasVencimiento: 365,

      tipoCertificado: null,

      estado: 'ACTIVO',

      descripcion: '',

      requistos: '',

      descrServicio: '',

      tipoServ: 'CUR',

      facturar: 'NO',

      iva: 0,

      tarifaHoraPractica: 0,

    };

  }



  private auditDe(obj: Record<string, unknown> | null | undefined): AuditInfo | null {

    if (!obj) return null;

    return {

      fechaAudi: this.fmtFecha(obj['fechaAudi']),

      userAddReg: String(obj['userAddReg'] ?? '—'),

      userChangeRecord: String(obj['userChangeRecord'] ?? '—'),

      fechaMod: this.fmtFecha(obj['fechaMod']),

    };

  }



  cargar() {

    this.loading.set(true);

    const q = this.busqueda().trim();

    this.progSvc.listar({ q: q.length >= 2 ? q : undefined }).subscribe({

      next: (r) => {

        this.programas.set(r || []);

        this.loading.set(false);

      },

      error: (e) => {

        this.loading.set(false);

        this.msg.set(e?.error?.message || 'Error cargando programas');

      },

    });

  }

  setVista(v: VistaLista) {
    this.vista.set(v);
    saveVistaLista('argo-programas-vista', v);
  }

  toggleSort(col: SortColPrograma) {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
    saveSortPrefs(this.sortCol(), this.sortDir());
  }

  sortIcon(col: SortColPrograma): string {
    if (this.sortCol() !== col) return '↕';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  sortAria(col: SortColPrograma): 'ascending' | 'descending' | 'none' {
    if (this.sortCol() !== col) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }



  patch<K extends keyof ProgramaDto>(k: K, v: ProgramaDto[K]) {
    const coerced = coerceProgramaNumeric(k, v);
    this.form.update((f) => {
      const next = { ...f, [k]: coerced };
      if (k === 'valorMatricula' || k === 'tarifa1') {
        const v1 = Number(k === 'tarifa1' ? coerced : next.valorMatricula) || 0;
        next.tarifa1 = v1;
        next.valorMatricula = v1;
      }
      return next;
    });
  }



  nuevo() {

    if (this.tiposCargando()) {

      this.msg.set('Espere a que carguen los tipos de capacitación.');

      return;

    }

    if (!this.tiposCap().length) {

      this.msg.set('Faltan tipos de capacitación. Contacte al administrador del sistema.');

      return;

    }

    this.editando.set(null);

    this.servicioVinculado.set(null);
    this.serviciosVinculados.set([]);
    this.servicioHoraPractica.set(null);

    this.auditPrograma.set(null);

    this.auditServicio.set(null);

    const t = this.tiposCap()[0]?.id ?? '';

    this.form.set({ ...this.formVacio(), idTipCap: t, tipoServ: this.inferirTipoServ(t), tipoCertificado: this.inferirTipoCert(t) });

    this.modalAbierto.set(true);

    this.msg.set(null);

  }



  editar(p: Programa) {

    this.editando.set(p);

    this.progSvc.obtener(p.idPrograma).subscribe({

      next: (det) => {

        const prog = det.programa;

        const lista = det.servicios?.length ? det.servicios : det.servicio ? [det.servicio] : [];
        const horaP = lista.find((x) => this.esHoraPractica(x)) ?? null;
        const matricula = lista.filter((x) => !this.esHoraPractica(x));
        const s = matricula[0] ?? null;

        this.servicioVinculado.set(s);
        this.serviciosVinculados.set(matricula);
        this.servicioHoraPractica.set(horaP);

        this.auditPrograma.set(this.auditDe(prog as unknown as Record<string, unknown>));

        this.auditServicio.set(this.auditDe(s as unknown as Record<string, unknown>));

        this.form.set({

          codigoProg: prog.codigoProg,

          nombreProg: prog.nombreProg,

          nomCert: prog.nomCert || '',

          idTipCap: prog.idTipCap ?? '',

          semestres: prog.semestres ?? null,

          horas: prog.horas ?? null,

          horasTeoria: prog.horasTeoria ?? null,

          horasPractica: prog.horasPractica ?? null,

          horasTaller: prog.horasTaller ?? null,

          valorMatricula: this.num(prog.valorMatricula),

          tarifa1: this.num(s?.tarifa1 ?? prog.valorMatricula),

          tarifa2: this.num(s?.tarifa2),

          tarifa3: this.num(s?.tarifa3),

          diasVencimiento: prog.diasVencimiento ?? 365,

          tipoCertificado: prog.tipoCertificado ?? null,

          estado: prog.estado || 'ACTIVO',

          descripcion: prog.descripcion || '',

          requistos: prog.requistos || '',

          descrServicio: s?.descrServicio || prog.nombreProg || '',

          tipoServ: s?.tipoServ ?? this.inferirTipoServ(prog.idTipCap),

          facturar: this.facturarStr(s?.facturar),

          iva: this.num(s?.iva),

          tarifaHoraPractica: this.num(horaP?.tarifa1),

        });

        this.modalAbierto.set(true);

      },

      error: (e) => this.msg.set(e?.error?.message || 'No se pudo cargar el programa'),

    });

  }



  cerrarModal() {

    this.modalAbierto.set(false);

    this.editando.set(null);

  }



  guardar() {

    const f = this.form();

    if (!f.nombreProg?.trim()) {

      this.msg.set('El nombre del programa es obligatorio.');

      return;

    }

    if (f.idTipCap === '' || f.idTipCap == null) {

      this.msg.set('Seleccione el tipo de capacitación.');

      return;

    }

    if (!this.esProgramaJornadasCapForm() && (f.tarifa1 ?? f.valorMatricula ?? 0) <= 0) {

      this.msg.set('Indique la tarifa 1 / valor de matrícula.');

      return;

    }

    const esJorn = this.esProgramaJornadasCapForm();

    const payload: ProgramaDto = {

      ...f,

      valorMatricula: esJorn ? 0 : (f.tarifa1 ?? f.valorMatricula ?? 0),

      tarifa1: esJorn ? 0 : (f.tarifa1 ?? f.valorMatricula ?? 0),

      tipoCertificado: esJorn ? 'jornada_capacitacion' : (f.tipoCertificado ?? this.inferirTipoCert(f.idTipCap, f.nombreProg)),

      descrServicio: (f.descrServicio || f.nombreProg).trim(),

      nomCert: (f.nomCert || f.nombreProg).trim(),

    };

    this.saving.set(true);

    this.msg.set(null);

    const eraEdicion = !!this.editando();

    const idEdicion = this.editando()?.idPrograma;

    const req = eraEdicion

      ? this.progSvc.actualizar(idEdicion!, payload)

      : this.progSvc.crear(payload);

    req.subscribe({

      next: (r) => {

        this.saving.set(false);

        this.modalAbierto.set(false);

        this.editando.set(null);

        this.catSvc.invalidate('programas');

        this.catSvc.invalidate('servicios');

        const extra = r as {
          message?: string;
          servicio?: { idServ?: number | string };
          servicios?: { idServ?: number | string }[];
        };

        this.msg.set(extra.message || (eraEdicion ? 'Programa actualizado.' : 'Programa creado.'));

        this.cargar();

      },

      error: (e) => {

        this.saving.set(false);

        const m = e?.error?.message || 'Error al guardar';

        this.msg.set(e?.status === 403 ? `${m} — Verifique su rol de usuario.` : m);

      },

    });

  }



  async eliminar(p: Programa) {

    if (!this.puedeGestionarPrograma()) {
      this.msg.set('Solo quien administra programas puede eliminar.');

      return;

    }

    const ok = await this.confirm.open({

      title: 'Eliminar programa',

      message: `¿Eliminar permanentemente «${p.nombreProg}» y su servicio de matrícula?`,

      confirmLabel: 'Eliminar',

      variant: 'danger',

    });

    if (!ok) return;

    this.progSvc.eliminar(p.idPrograma).subscribe({

      next: (r) => {

        this.catSvc.invalidate('programas');

        this.catSvc.invalidate('servicios');

        this.msg.set(r.message || 'Programa eliminado.');

        this.cargar();

      },

      error: (e) => this.msg.set(e?.error?.message || 'Error al eliminar'),

    });

  }



  num(v: unknown): number {

    if (v == null) return 0;

    if (typeof v === 'number') return v;

    return Number(v) || 0;

  }



  facturarStr(v: unknown): string {

    if (v === true || v === 'SI' || v === 'si') return 'SI';

    return 'NO';

  }



  fmtFecha(v: unknown): string {

    if (v == null || v === '') return '—';

    const d = v instanceof Date ? v : new Date(String(v));

    if (Number.isNaN(d.getTime())) return String(v);

    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

  }



  labelTipo(id: string | number | undefined): string {

    const t = this.tiposCap().find((x) => String(x.id) === String(id));

    return t?.label || String(id ?? '—');

  }



  inferirTipoServ(idTipCap: string | number | undefined): string {

    const label = this.labelTipo(idTipCap).toLowerCase();

    if (/licencia|conduccion/.test(label)) return 'CEA';

    if (/diplomado/.test(label)) return 'DIP';

    if (/tecnico|competenc/.test(label)) return 'TEC';

    return 'CUR';

  }

  esLicenciaConduccionForm(): boolean {
    const label = this.labelTipo(this.form().idTipCap).toLowerCase();
    return label.includes('licencia') && label.includes('conduccion');
  }

  previewDescrHoraPractica(): string {
    const f = this.form();
    const nombre = (f.nomCert || f.nombreProg || '').trim();
    const m =
      nombre.match(/\b([ABC]\s*\d?)\b/i) ||
      String(f.codigoProg || '').match(/\b([ABC]\d?)\b/i);
    if (m) {
      const cat = String(m[1]).replace(/\s+/g, '').toUpperCase();
      return `HORA CLASE PRACTICA LICENCIA ${cat}`;
    }
    if (/licencia/i.test(nombre)) return `HORA CLASE PRACTICA ${nombre}`.toUpperCase();
    return nombre ? `HORA CLASE PRACTICA ${nombre}`.toUpperCase() : 'HORA CLASE PRACTICA LICENCIA';
  }

  private esHoraPractica(s: ServicioPrograma | null | undefined): boolean {
    if (!s) return false;
    if (s.rolServicio === 'hora_practica') return true;
    return /\bhora\b.*\bpractica\b/i.test(String(s.descrServicio || ''));
  }

  usaSemestresEnForm(): boolean {
    const s = Number(this.form().semestres);
    return Number.isFinite(s) && s >= 1;
  }

  valorPorSemestrePreview(): number {
    const n = Number(this.form().semestres);
    const total = this.num(this.form().tarifa1 ?? this.form().valorMatricula);
    if (!Number.isFinite(n) || n < 1 || total <= 0) return 0;
    return Math.floor(total / n);
  }

  inferirTipoCert(idTipCap: string | number | undefined, nombreProg?: string): TipoCertificadoId | null {

    const blob = [nombreProg, this.labelTipo(idTipCap)].join(' ').toLowerCase();

    if (/mercanc[ií]as\s*peligrosas|peligrosas\s*clase|transporte\s*de\s*mercanc/.test(blob)) {

      return 'mercancias_peligrosas';

    }

    const label = this.labelTipo(idTipCap).toLowerCase();

    if (/jornadas?\s*de\s*capacitaci[oó]n|cap\s*jornada\s*capacitacion|jornada\s*capacitacion/.test(label)) {
      return 'jornada_capacitacion';
    }

    if (label.includes('competenc')) return 'competencias';

    if (label.includes('diplomado')) return 'diplomado';

    if (label.includes('tecnico')) return 'tecnico';

    if (label.includes('licencia') || label.includes('conduccion')) return 'licencia';

    if (label.includes('curso')) return 'curso';

    return 'curso';

  }

  formatoCertHint(tipo?: string | null): string {

    if (!tipo) {

      return 'Automático: se infiere del tipo de capacitación y del nombre del programa.';

    }

    const cfg = this.configCert();

    const slot = cfg?.plantillaPorTipo?.[tipo as TipoCertificadoId];

    if (!slot?.id) {

      return `«${labelTipoCert(tipo)}»: asigne la plantilla en Config. Certificados.`;

    }

    const pl = this.plantillasCert().find((p) => p._id === slot.id);

    const ori = labelOrientacion(slot.orientacion);

    return pl ? `Plantilla: ${pl.nombre} (${ori})` : `Plantilla configurada (${ori})`;

  }

  labelTipoCert = labelTipoCert;



  esProgramaJornadasCapForm(): boolean {
    const f = this.form();
    if (f.tipoCertificado === 'jornada_capacitacion') return true;
    const label = this.labelTipo(f.idTipCap).toLowerCase();
    return /jornadas?\s*de\s*capacitaci[oó]n|jornada\s*capacitacion|cap\s*jornada/.test(label);
  }

  onTipoCapChange(id: string | number) {
    this.patch('idTipCap', id);
    const cert = this.inferirTipoCert(id, this.form().nombreProg);
    if (!this.editando()) {
      this.patch('tipoServ', this.inferirTipoServ(id));
      this.patch('tipoCertificado', cert);
    }
    if (cert === 'jornada_capacitacion') {
      this.patch('valorMatricula', 0);
      this.patch('tarifa1', 0);
      this.patch('tarifa2', 0);
      this.patch('tarifa3', 0);
      this.patch('semestres', null);
    }
  }

  onTipoCertPick(opt: EnumBuscarOption): void {
    const v = String(opt.value);
    this.patch('tipoCertificado', v === '' ? null : (v as TipoCertificadoId));
  }

  onTipoCertLimpiar(): void {
    this.patch('tipoCertificado', null);
  }

  onTipoCapPick(opt: EnumBuscarOption): void {
    this.onTipoCapChange(opt.value);
  }

  onTipoCapLimpiar(): void {
    this.patch('idTipCap', '');
  }

  onEstadoPick(opt: EnumBuscarOption): void {
    this.patch('estado', String(opt.value));
  }

  onEstadoLimpiar(): void {
    this.patch('estado', 'ACTIVO');
  }

  onTipoServPick(opt: EnumBuscarOption): void {
    this.patch('tipoServ', String(opt.value));
  }

  onTipoServLimpiar(): void {
    this.patch('tipoServ', '');
  }

  onFacturarPick(opt: EnumBuscarOption): void {
    this.patch('facturar', String(opt.value));
  }

  onFacturarLimpiar(): void {
    this.patch('facturar', 'NO');
  }



  modalTitulo(): string {

    return this.editando() ? `Editar programa #${this.editando()!.idPrograma}` : 'Nuevo programa';

  }

  modalSubtitulo(): string {
    if (this.esProgramaJornadasCapForm()) {
      return 'Jornadas de capacitación: no genera servicio de matrícula (sin cobro al alumno).';
    }
    return this.editando()
      ? 'Datos del programa y servicio de matrícula.'
      : 'El código se asigna si lo deja vacío. El servicio se crea al guardar.';
  }

  capCodigo = capCodigo;
  capEstado = capEstado;
  capHoras = capHoras;
  capMoneda = capMoneda;
  capTipoCap = capTipoCapLabel;
}

