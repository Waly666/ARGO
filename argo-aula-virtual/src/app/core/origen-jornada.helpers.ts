import { EnumBuscarOption } from '../shared/catalogo-enum-buscar/catalogo-enum-buscar.component';

export type OrigenJornadaKey = 'colegio' | 'estamento' | 'empresa' | 'operativo';

export const PERFILES_INSTITUCION_UI: Array<{ key: 'estudiante' | 'profesor'; label: string }> = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'profesor', label: 'Profesor' },
];

export function normalizarNivelInstitucion(raw: unknown): string {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (['primaria', 'secundaria', 'tecnica', 'tecnologica', 'universidad'].includes(t)) return t;
  if (t === 'colegio' || t.includes('secund')) return 'secundaria';
  if (t.includes('tecnic') && !t.includes('tecnolog')) return 'tecnica';
  if (t.includes('tecnolog')) return 'tecnologica';
  if (t.includes('univers')) return 'universidad';
  if (t.includes('primar')) return 'primaria';
  return '';
}

export function opcionesTipoInstitucion(): EnumBuscarOption[] {
  return [
    { value: 'primaria', label: 'Primaria' },
    { value: 'secundaria', label: 'Secundaria' },
    { value: 'tecnica', label: 'Técnica' },
    { value: 'tecnologica', label: 'Tecnológica' },
    { value: 'universidad', label: 'Universidad' },
  ];
}

export function opcionesGradoColegio(nivel: string): EnumBuscarOption[] {
  const t = normalizarNivelInstitucion(nivel);
  if (t === 'primaria') {
    return Array.from({ length: 5 }, (_, i) => {
      const n = i + 1;
      return { value: String(n), label: `Curso ${n}` };
    });
  }
  return Array.from({ length: 6 }, (_, i) => {
    const n = i + 6;
    return { value: String(n), label: `Grado ${n}` };
  });
}

export function opcionesSemestreInstitucion(): EnumBuscarOption[] {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: `Semestre ${n}` };
  });
}

export function opcionesAreaImparte(): EnumBuscarOption[] {
  return [
    { value: 'matematicas', label: 'Matemáticas' },
    { value: 'lengua_castellana', label: 'Lengua castellana' },
    { value: 'ingles', label: 'Inglés' },
    { value: 'ciencias_naturales', label: 'Ciencias naturales' },
    { value: 'ciencias_sociales', label: 'Ciencias sociales' },
    { value: 'educacion_fisica', label: 'Educación física' },
    { value: 'educacion_artistica', label: 'Educación artística' },
    { value: 'tecnologia_informatica', label: 'Tecnología e informática' },
    { value: 'etica_valores', label: 'Ética y valores' },
    { value: 'religion', label: 'Religión' },
    { value: 'filosofia', label: 'Filosofía' },
    { value: 'quimica', label: 'Química' },
    { value: 'fisica', label: 'Física' },
    { value: 'biologia', label: 'Biología' },
    { value: 'orientacion_escolar', label: 'Orientación escolar' },
    { value: 'coordinacion', label: 'Coordinación académica' },
    { value: 'directivo', label: 'Directivo / rectoría' },
    { value: 'otra', label: 'Otra área' },
  ];
}

export function esNivelBasicaMedia(nivel: string): boolean {
  const t = normalizarNivelInstitucion(nivel);
  return t === 'primaria' || t === 'secundaria';
}

export function esNivelSuperior(nivel: string): boolean {
  const t = normalizarNivelInstitucion(nivel);
  return t === 'tecnica' || t === 'tecnologica' || t === 'universidad';
}

export function labelInstitucionBuscar(nivel: string): string {
  const t = normalizarNivelInstitucion(nivel);
  if (t === 'primaria' || t === 'secundaria') return 'Institución *';
  if (t === 'tecnica') return 'Institución técnica *';
  if (t === 'tecnologica') return 'Institución tecnológica *';
  return 'Universidad / IES *';
}

export function labelCursoGrado(nivel: string): string {
  return normalizarNivelInstitucion(nivel) === 'primaria' ? 'Curso *' : 'Grado *';
}

export interface OrigenJornadaFormSlice {
  origenJornadaCap: string;
  tipoInstitucionEducativa: string;
  perfilInstitucionEducativa: string;
  colegioCodigo: string;
  colegioNombre: string;
  gradoColegio: number | null;
  semestreInstitucion: number | null;
  titulacionCodigo: string;
  programaInstitucion: string;
  areaImparteColegio: string;
  estamentoId: string;
  estamentoNombre: string;
  cargoEstamento: string;
  dependenciaEstamento: string;
  empresaId: string | null;
  empresaNombre: string | null;
}

export function validarOrigenJornadaForm(f: OrigenJornadaFormSlice): string | null {
  const oj = String(f.origenJornadaCap || '').trim();
  if (!oj) return 'Seleccione el origen del alumno en jornada.';
  if (oj === 'colegio') {
    const tipoInst = normalizarNivelInstitucion(f.tipoInstitucionEducativa) || 'secundaria';
    const perfil = f.perfilInstitucionEducativa === 'profesor' ? 'profesor' : 'estudiante';
    if (!String(f.colegioNombre || f.colegioCodigo || '').trim()) {
      return 'Seleccione la institución educativa.';
    }
    if (perfil === 'profesor') {
      if (!String(f.areaImparteColegio || '').trim()) return 'Seleccione el área que imparte.';
    } else if (esNivelBasicaMedia(tipoInst)) {
      const g = Number(f.gradoColegio);
      const minG = tipoInst === 'primaria' ? 1 : 6;
      const maxG = tipoInst === 'primaria' ? 5 : 11;
      if (!Number.isFinite(g) || g < minG || g > maxG) {
        return tipoInst === 'primaria'
          ? 'Seleccione el curso (1–5).'
          : 'Seleccione el grado (6–11).';
      }
    } else if (esNivelSuperior(tipoInst)) {
      const s = Number(f.semestreInstitucion);
      if (!Number.isFinite(s) || s < 1 || s > 12) return 'Seleccione el semestre (1–12).';
      if (!String(f.programaInstitucion || f.titulacionCodigo || '').trim()) {
        return 'Seleccione la titulación / programa.';
      }
    }
  } else if (oj === 'estamento') {
    if (!String(f.estamentoId || f.estamentoNombre || '').trim()) {
      return 'Seleccione el estamento público.';
    }
    if (!String(f.cargoEstamento || '').trim()) return 'Indique el cargo.';
    if (!String(f.dependenciaEstamento || '').trim()) return 'Indique la dependencia.';
  } else if (oj === 'empresa') {
    if (!f.empresaId) return 'Seleccione la empresa del alumno.';
  }
  return null;
}
