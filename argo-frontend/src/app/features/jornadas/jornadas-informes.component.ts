import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfigRecibo, ConfigService } from '../../core/services/config.service';
import {
  ClaseJornadaDto,
  ContratacionDto,
  InformesJornadaResp,
  JornadaCapDto,
  JornadaCapService,
} from '../../core/services/jornada-cap.service';
import { ArgoDateInputComponent } from '../../shared/argo-date-input/argo-date-input.component';
import {
  CatalogoEnumBuscarComponent,
  EnumBuscarOption,
} from '../../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';
import {
  abrirInformeJornadasPdf,
  buildJornadasInformeHtml,
  type ColumnaInformeJornada,
} from './jornadas-informe-document';

type TabInforme = 'porClase' | 'porJornada' | 'porContrato' | 'certificados';

const TITULOS_TAB: Record<TabInforme, string> = {
  porClase: 'Alumnos por clase',
  porJornada: 'Alumnos por jornada',
  porContrato: 'Alumnos por contrato',
  certificados: 'Certificados de jornadas',
};

function columnasDeTab(t: TabInforme): ColumnaInformeJornada[] {
  switch (t) {
    case 'porClase':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'idClaseCorto', l: 'ID clase' },
        { k: 'programa', l: 'Programa' },
        { k: 'carpa', l: 'Carpa' },
        { k: 'estadoClase', l: 'Estado clase' },
        { k: 'instructor', l: 'Instructor' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'inscrito', l: 'Inscrito' },
        { k: 'asistio', l: 'Asistió' },
        { k: 'certificadoCodigo', l: 'Certificado' },
      ];
    case 'porJornada':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'clasesInscrito', l: 'Clases inscrito' },
        { k: 'clasesAsistidas', l: 'Clases asistidas' },
        { k: 'programas', l: 'Programas' },
        { k: 'certificado', l: 'Certificado' },
        { k: 'certificadoCodigo', l: 'Código cert.' },
      ];
    case 'porContrato':
      return [
        { k: 'codContrato', l: 'Contrato' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'empresaNombre', l: 'Empresa' },
        { k: 'clasesInscrito', l: 'Clases inscrito' },
        { k: 'clasesAsistidas', l: 'Clases asistidas' },
        { k: 'programas', l: 'Programas' },
        { k: 'certificado', l: 'Certificado' },
        { k: 'certificadoCodigo', l: 'Código cert.' },
      ];
    case 'certificados':
      return [
        { k: 'codigoCert', l: 'Código' },
        { k: 'fechaEmision', l: 'Emisión' },
        { k: 'numDoc', l: 'Documento' },
        { k: 'nombreAlumno', l: 'Alumno' },
        { k: 'codContrato', l: 'Contrato' },
        { k: 'idJornadaCorto', l: 'ID jornada' },
        { k: 'fechaJornada', l: 'Fecha jornada' },
        { k: 'municipio', l: 'Municipio' },
        { k: 'estado', l: 'Estado' },
      ];
  }
}

function idCorto(id?: string | null): string {
  const s = String(id || '').trim();
  return s ? s.slice(-6).toUpperCase() : '—';
}

@Component({
  selector: 'argo-jornadas-informes',
  standalone: true,
  imports: [CommonModule, FormsModule, ArgoDateInputComponent, CatalogoEnumBuscarComponent],
  templateUrl: './jornadas-informes.component.html',
  styleUrls: ['./jornadas-informes.component.scss'],
})
export class JornadasInformesComponent implements OnInit {
  private jornadaSvc = inject(JornadaCapService);
  private configSvc = inject(ConfigService);

  desde = '';
  hasta = '';
  idContrato = '';
  idJornada = '';
  idClase = '';

  contratos = signal<ContratacionDto[]>([]);
  jornadas = signal<JornadaCapDto[]>([]);
  clases = signal<ClaseJornadaDto[]>([]);
  empresa = signal<ConfigRecibo | null>(null);
  tab = signal<TabInforme>('porClase');
  loading = signal(false);
  exportando = signal(false);
  msg = signal<string | null>(null);
  data = signal<InformesJornadaResp | null>(null);

  tituloTabActual = computed(() => TITULOS_TAB[this.tab()]);
  logoEmpresa = computed(
    () => this.empresa()?.urlLogoDataUrl || this.empresa()?.urlLogo || '',
  );

  opcionesContrato = computed<EnumBuscarOption[]>(() =>
    this.contratos()
      .filter((c): c is ContratacionDto & { _id: string } => !!c._id)
      .map((c) => ({
        value: c._id,
        label: `${c.codContrato || '—'} — ${c.nombreComercial || c.razoSocial || 'Contrato'}`,
      })),
  );

  opcionesJornada = computed<EnumBuscarOption[]>(() =>
    this.jornadas()
      .filter((j): j is JornadaCapDto & { _id: string } => !!j._id)
      .map((j) => {
        const contrato = this.contratos().find((c) => c._id === j.idContrato);
        const cod = contrato?.codContrato || j.codContrato || '—';
        const fecha = j.fechaProgramacion
          ? new Date(j.fechaProgramacion).toLocaleDateString('es-CO')
          : '';
        const id = idCorto(j._id);
        return {
          value: j._id,
          label: `${cod} · ${id}${fecha ? ` · ${fecha}` : ''}${j.municipio ? ` · ${j.municipio}` : ''}`,
        };
      }),
  );

  opcionesClase = computed<EnumBuscarOption[]>(() =>
    this.clases()
      .filter((c): c is ClaseJornadaDto & { _id: string } => !!c._id)
      .map((c) => ({
        value: c._id,
        label: `${idCorto(c._id)} · ${c.programaNombre || c.idPrograma || 'Sin programa'}${c.carpaNombre ? ` · ${c.carpaNombre}` : ''}`,
      })),
  );

  textoContrato = computed(() => {
    const id = this.idContrato;
    if (!id) return '';
    const c = this.contratos().find((x) => x._id === id);
    if (!c) return '';
    return `${c.codContrato || '—'} — ${c.nombreComercial || c.razoSocial || 'Contrato'}`;
  });

  codigoContratoFiltro = computed(() => {
    const id = this.idContrato;
    if (!id) return '';
    const c = this.contratos().find((x) => x._id === id);
    return String(c?.codContrato || '').trim();
  });

  textoJornada = computed(() => {
    const id = this.idJornada;
    if (!id) return '';
    return this.opcionesJornada().find((o) => String(o.value) === id)?.label || idCorto(id);
  });

  idJornadaCortoFiltro = computed(() => (this.idJornada ? idCorto(this.idJornada) : ''));

  fechaJornadaFiltro = computed(() => {
    const j = this.jornadas().find((x) => x._id === this.idJornada);
    if (!j?.fechaProgramacion) return '';
    return new Date(j.fechaProgramacion).toLocaleDateString('es-CO');
  });

  textoClase = computed(() => {
    const id = this.idClase;
    if (!id) return '';
    return this.opcionesClase().find((o) => String(o.value) === id)?.label || idCorto(id);
  });

  idClaseCortoFiltro = computed(() => (this.idClase ? idCorto(this.idClase) : ''));

  /** Filas de la pestaña activa ya recortadas por filtros (misma fuente que el PDF). */
  filasActivas = computed(() => this.dataFiltradaPorTab(this.tab()));

  gruposPorJornada = computed(() => {
    if (this.tab() !== 'porJornada') return [];
    const filas = this.filasActivas();
    const map = new Map<
      string,
      {
        key: string;
        codContrato: string;
        idJornadaCorto: string;
        fechaJornada: string;
        municipio: string;
        filas: Record<string, unknown>[];
      }
    >();
    for (const row of filas) {
      const idJ = String(row['idJornada'] || row['idJornadaCorto'] || '');
      const cod = String(row['codContrato'] || '—');
      const key = `${cod}|${idJ}`;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          codContrato: cod,
          idJornadaCorto: String(row['idJornadaCorto'] || idCorto(idJ)),
          fechaJornada: String(row['fechaJornada'] || ''),
          municipio: String(row['municipio'] || ''),
          filas: [],
        };
        map.set(key, g);
      }
      g.filas.push(row);
    }
    return [...map.values()];
  });

  columnasActivas = computed<ColumnaInformeJornada[]>(() => columnasDeTab(this.tab()));

  ngOnInit(): void {
    this.configSvc.obtenerReciboEncabezado().subscribe({
      next: (c) => this.empresa.set(c),
      error: () => this.empresa.set(null),
    });
    this.jornadaSvc.listarContratos().subscribe({
      next: (rows) => this.contratos.set(rows || []),
      error: () => this.contratos.set([]),
    });
    this.cargarOpcionesJornada();
    this.cargar();
  }

  onContratoPick(opt: EnumBuscarOption): void {
    this.idContrato = String(opt.value || '');
    this.idJornada = '';
    this.idClase = '';
    this.clases.set([]);
    this.cargarOpcionesJornada();
  }

  onContratoLimpiar(): void {
    this.idContrato = '';
    this.idJornada = '';
    this.idClase = '';
    this.clases.set([]);
    this.cargarOpcionesJornada();
  }

  onJornadaPick(opt: EnumBuscarOption): void {
    this.idJornada = String(opt.value || '');
    this.idClase = '';
    this.cargarOpcionesClase();
  }

  onJornadaLimpiar(): void {
    this.idJornada = '';
    this.idClase = '';
    this.clases.set([]);
  }

  onClasePick(opt: EnumBuscarOption): void {
    this.idClase = String(opt.value || '');
  }

  onClaseLimpiar(): void {
    this.idClase = '';
  }

  setTab(t: TabInforme): void {
    this.tab.set(t);
  }

  cargarOpcionesJornada(): void {
    this.jornadaSvc
      .listarJornadas({
        idContrato: this.idContrato || undefined,
        desde: this.desde || undefined,
        hasta: this.hasta || undefined,
      })
      .subscribe({
        next: (rows) => this.jornadas.set(rows || []),
        error: () => this.jornadas.set([]),
      });
  }

  cargarOpcionesClase(): void {
    if (!this.idJornada) {
      this.clases.set([]);
      return;
    }
    this.jornadaSvc.listarClases({ idJornada: this.idJornada }).subscribe({
      next: (rows) => this.clases.set(rows || []),
      error: () => this.clases.set([]),
    });
  }

  paramsFiltro() {
    return {
      idContrato: this.idContrato || undefined,
      idJornada: this.idJornada || undefined,
      idClase: this.idClase || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
    };
  }

  cargar(): void {
    this.loading.set(true);
    this.msg.set(null);
    this.cargarOpcionesJornada();
    if (this.idJornada) this.cargarOpcionesClase();
    this.jornadaSvc.informesJornada(this.paramsFiltro()).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.data.set(null);
        this.msg.set(e?.error?.message || 'No se pudieron cargar los informes.');
      },
    });
  }

  /**
   * Recorte local de seguridad: el PDF usa exactamente estas filas.
   * Parte de porClase (detalle) para no mezclar contratos/jornadas ajenos.
   */
  private dataFiltradaPorTab(tab: TabInforme): Record<string, unknown>[] {
    const d = this.data();
    if (!d) return [];

    const idC = this.idContrato;
    const cod = this.codigoContratoFiltro();
    const idJ = this.idJornada;
    const idCl = this.idClase;

    let porClase = (d.porClase || []) as Record<string, unknown>[];
    if (idC || cod) {
      porClase = porClase.filter(
        (r) =>
          (idC && String(r['idContrato'] || '') === idC) ||
          (cod && String(r['codContrato'] || '') === cod),
      );
    }
    if (idJ) {
      porClase = porClase.filter((r) => String(r['idJornada'] || '') === idJ);
    }
    if (idCl) {
      porClase = porClase.filter((r) => String(r['idClase'] || '') === idCl);
    }

    if (tab === 'porClase') return porClase;

    const docs = new Set(porClase.map((r) => String(r['numDoc'])));
    const jornadas = new Set(porClase.map((r) => String(r['idJornada'])));
    const contratos = new Set(porClase.map((r) => String(r['idContrato'])));
    const codigos = new Set(porClase.map((r) => String(r['codContrato'])));

    let filas = (d[tab] as Record<string, unknown>[]) || [];
    if (tab === 'porJornada') {
      return filas.filter(
        (r) =>
          docs.has(String(r['numDoc'])) &&
          (!idJ || String(r['idJornada'] || '') === idJ) &&
          (!idC || String(r['idContrato'] || '') === idC || codigos.has(String(r['codContrato'] || ''))),
      );
    }
    if (tab === 'porContrato') {
      return filas.filter(
        (r) =>
          docs.has(String(r['numDoc'])) &&
          (contratos.has(String(r['idContrato'] || '')) ||
            codigos.has(String(r['codContrato'] || ''))),
      );
    }
    // certificados
    return filas.filter((r) => {
      if (!docs.has(String(r['numDoc']))) return false;
      if (idJ && r['idJornada'] && String(r['idJornada']) !== idJ) return false;
      if (idC && r['idContrato'] && String(r['idContrato']) !== idC) return false;
      if (cod && r['codContrato'] && String(r['codContrato']) !== cod) return false;
      return true;
    });
  }

  celda(row: Record<string, unknown>, k: string): string {
    const v = row[k];
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (v == null || v === '') return '—';
    return String(v);
  }

  exportar(tipo: 'completo' | 'por-clase' | 'por-jornada' | 'por-contrato' | 'certificados'): void {
    this.exportando.set(true);
    this.msg.set(null);
    this.jornadaSvc.exportarInformesJornada({ ...this.paramsFiltro(), tipo }).subscribe({
      next: (blob) => {
        this.exportando.set(false);
        const fecha = new Date().toISOString().slice(0, 10);
        this.descargar(blob, `informes-jornadas-${tipo}-${fecha}.xlsx`);
      },
      error: (e) => {
        this.exportando.set(false);
        this.msg.set(e?.error?.message || 'No se pudo exportar el Excel.');
      },
    });
  }

  exportarTabActual(): void {
    const map: Record<TabInforme, 'por-clase' | 'por-jornada' | 'por-contrato' | 'certificados'> = {
      porClase: 'por-clase',
      porJornada: 'por-jornada',
      porContrato: 'por-contrato',
      certificados: 'certificados',
    };
    this.exportar(map[this.tab()]);
  }

  imprimirTabActual(): void {
    if (!this.data()) {
      this.msg.set('Consulte primero los informes.');
      return;
    }
    const t = this.tab();
    const filas = this.filasActivas();
    const html = buildJornadasInformeHtml({
      titulo: TITULOS_TAB[t],
      subtitulo: 'Informe de jornadas de capacitación',
      filtros: this.filtrosDoc(),
      codigoContratoDestacado: this.codigoContratoParaPdf(filas),
      idJornadaDestacado: this.idJornadaCortoParaPdf(filas),
      fechaJornadaDestacada: this.fechaJornadaParaPdf(filas),
      idClaseDestacado: this.idClaseCortoFiltro() || undefined,
      resumen: this.resumenDeFilas(filas, t),
      secciones:
        t === 'porJornada'
          ? this.seccionesPdfPorJornada(filas)
          : [
              {
                titulo: TITULOS_TAB[t],
                columnas: this.columnasActivas(),
                filas,
              },
            ],
      empresa: this.empresa(),
    });
    if (!abrirInformeJornadasPdf(html)) {
      this.msg.set('Permita ventanas emergentes para ver e imprimir el PDF.');
    }
  }

  imprimirTodo(): void {
    if (!this.data()) {
      this.msg.set('Consulte primero los informes.');
      return;
    }
    const tabs: TabInforme[] = ['porClase', 'porJornada', 'porContrato', 'certificados'];
    const secciones = tabs.flatMap((t) => {
      const filas = this.dataFiltradaPorTab(t);
      if (t === 'porJornada') return this.seccionesPdfPorJornada(filas);
      return [
        {
          titulo: TITULOS_TAB[t],
          columnas: columnasDeTab(t),
          filas,
        },
      ];
    });
    const filasClase = this.dataFiltradaPorTab('porClase');
    const html = buildJornadasInformeHtml({
      titulo: 'Informes de jornadas de capacitación',
      subtitulo: 'Consolidado de alumnos y certificados (filtros aplicados)',
      filtros: this.filtrosDoc(),
      codigoContratoDestacado: this.codigoContratoParaPdf(filasClase),
      idJornadaDestacado: this.idJornadaCortoParaPdf(filasClase),
      fechaJornadaDestacada: this.fechaJornadaParaPdf(filasClase),
      idClaseDestacado: this.idClaseCortoFiltro() || undefined,
      resumen: this.resumenDeFilas(filasClase, 'porClase'),
      secciones,
      empresa: this.empresa(),
    });
    if (!abrirInformeJornadasPdf(html)) {
      this.msg.set('Permita ventanas emergentes para ver e imprimir el PDF.');
    }
  }

  private codigoContratoParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.codigoContratoFiltro()) return this.codigoContratoFiltro();
    const cods = [...new Set(filas.map((r) => String(r['codContrato'] || '').trim()).filter(Boolean))];
    return cods.length === 1 ? cods[0] : undefined;
  }

  private idJornadaCortoParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.idJornadaCortoFiltro()) return this.idJornadaCortoFiltro();
    const ids = [...new Set(filas.map((r) => String(r['idJornadaCorto'] || '').trim()).filter(Boolean))];
    return ids.length === 1 ? ids[0] : undefined;
  }

  private fechaJornadaParaPdf(filas: Record<string, unknown>[]): string | undefined {
    if (this.fechaJornadaFiltro()) return this.fechaJornadaFiltro();
    const fechas = [...new Set(filas.map((r) => String(r['fechaJornada'] || '').trim()).filter(Boolean))];
    return fechas.length === 1 ? fechas[0] : undefined;
  }

  private resumenDeFilas(filas: Record<string, unknown>[], tab: TabInforme) {
    const alumnos = new Set(filas.map((r) => r['numDoc']).filter((x) => x != null && x !== ''));
    const asist = filas.filter((r) => r['asistio'] === true || r['asistio'] === 'Sí').length;
    const insc = filas.filter((r) => r['inscrito'] === true || r['inscrito'] === 'Sí').length;
    const certs =
      tab === 'certificados'
        ? filas.length
        : filas.filter((r) => r['certificadoCodigo'] || r['codigoCert'] || r['certificado'] === 'Sí')
            .length;
    return {
      alumnosUnicos: alumnos.size,
      totalFilasClase: tab === 'porClase' ? filas.length : alumnos.size,
      registrosAsistencia: asist,
      registrosInscripcion: insc,
      certificados: certs,
    };
  }

  private seccionesPdfPorJornada(filas: Record<string, unknown>[]) {
    const cols = columnasDeTab('porJornada').filter(
      (c) => c.k !== 'codContrato' && c.k !== 'idJornadaCorto',
    );
    const map = new Map<string, { titulo: string; filas: Record<string, unknown>[] }>();
    for (const row of filas) {
      const cod = String(row['codContrato'] || '—');
      const idJ = String(row['idJornadaCorto'] || idCorto(String(row['idJornada'] || '')));
      const fecha = String(row['fechaJornada'] || '');
      const key = `${cod}|${idJ}`;
      let g = map.get(key);
      if (!g) {
        g = {
          titulo: `Contrato ${cod}  ·  Jornada ${idJ}${fecha ? `  ·  ${fecha}` : ''}`,
          filas: [],
        };
        map.set(key, g);
      }
      g.filas.push(row);
    }
    return [...map.values()].map((g) => ({
      titulo: g.titulo,
      tituloGrande: true as const,
      columnas: cols,
      filas: g.filas,
    }));
  }

  private filtrosDoc(): {
    contrato?: string;
    jornada?: string;
    clase?: string;
    desde?: string;
    hasta?: string;
  } {
    return {
      contrato: this.textoContrato() || (this.codigoContratoFiltro() ? this.codigoContratoFiltro() : 'Todos los contratos'),
      jornada: this.textoJornada() || undefined,
      clase: this.textoClase() || undefined,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
    };
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
