import { ConfigRecibo } from '../../core/services/config.service';
import { JornadaCapDto } from '../../core/services/jornada-cap.service';
import {
  ColumnaInformeJornada,
  abrirInformeJornadasPdf,
  buildJornadasInformeHtml,
  jornadasInformeDocCss,
} from './jornadas-informe-document';
import { fmtClasesDictadasJor } from './jornada-ui.util';

export const COLUMNAS_LISTADO_JORNADAS_CONTRATO: ColumnaInformeJornada[] = [
  { k: 'codigoJornada', l: 'Código jornada' },
  { k: 'fecha', l: 'Fecha' },
  { k: 'municipio', l: 'Municipio' },
  { k: 'clasesDictadas', l: 'Clases dict.' },
  { k: 'alumnosCapacitados', l: 'Alumnos cap.' },
  { k: 'certificados', l: 'Certificados' },
  { k: 'direccion', l: 'Dirección' },
  { k: 'metaAlumnos', l: 'Meta alumnos' },
  { k: 'coordenadas', l: 'Coordenadas' },
  { k: 'estado', l: 'Estado' },
];

function fmtFechaInforme(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtCoordenadas(j: JornadaCapDto): string {
  if (j.lat == null || j.lng == null) return 'Sin GPS';
  return `${j.lat}, ${j.lng}`;
}

export function filasListadoJornadasContratoInforme(jornadas: JornadaCapDto[]): Record<string, unknown>[] {
  return jornadas.map((j) => ({
    codigoJornada: j.codigoJornada || '—',
    fecha: fmtFechaInforme(j.fechaProgramacion),
    municipio: j.municipio || '—',
    clasesDictadas: fmtClasesDictadasJor(j.clasesDictadas, j.totalClases),
    alumnosCapacitados: j.alumnosCapacitados ?? 0,
    certificados: j.certificadosJornada ?? 0,
    direccion: j.direccion || '—',
    metaAlumnos: j.numeObjeJornada ?? '—',
    coordenadas: fmtCoordenadas(j),
    estado: j.estado || '—',
  }));
}

const LISTADO_EXTRA_CSS = `
  table.tbl.tbl-listado-jornadas { font-size: 7.25pt; }
  table.tbl.tbl-listado-jornadas th,
  table.tbl.tbl-listado-jornadas td { padding: 2px 4px; }
  table.tbl.tbl-listado-jornadas td:nth-child(7) { max-width: 42mm; word-break: break-word; }
`;

export function buildListadoJornadasContratoHtml(opts: {
  codContrato: string;
  contratoLabel?: string;
  filtros?: { municipio?: string; fecha?: string; estado?: string };
  jornadas: JornadaCapDto[];
  empresa?: ConfigRecibo | null;
  atPageCss?: string;
}): string {
  const filas = filasListadoJornadasContratoInforme(opts.jornadas);
  const filtrosActivos = [
    opts.filtros?.municipio ? `Municipio: ${opts.filtros.municipio}` : '',
    opts.filtros?.fecha ? `Fecha: ${opts.filtros.fecha}` : '',
    opts.filtros?.estado ? `Estado: ${opts.filtros.estado}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const base = buildJornadasInformeHtml({
    titulo: 'Listado de jornadas del contrato',
    subtitulo: [
      'Jornadas de capacitación — programación del contrato',
      filtrosActivos,
    ]
      .filter(Boolean)
      .join(' · '),
    filtros: {
      contrato: opts.contratoLabel || opts.codContrato,
    },
    codigoContratoDestacado: opts.codContrato,
    secciones: [
      {
        titulo: `Jornadas (${filas.length})`,
        columnas: COLUMNAS_LISTADO_JORNADAS_CONTRATO,
        filas,
      },
    ],
    empresa: opts.empresa,
    atPageCss: opts.atPageCss,
  });

  const atPageCss = opts.atPageCss || '';
  const cssBlock = `<style>${jornadasInformeDocCss(atPageCss)}${LISTADO_EXTRA_CSS}</style>`;
  const htmlConTabla = base.replace(
    '<table class="tbl">',
    '<table class="tbl tbl-listado-jornadas">',
  );
  return htmlConTabla.replace(/<style>[\s\S]*?<\/style>/, cssBlock);
}

export function abrirListadoJornadasContratoPdf(html: string): boolean {
  return abrirInformeJornadasPdf(html);
}
