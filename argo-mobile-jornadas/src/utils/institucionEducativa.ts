/** Paridad con argo-frontend datos-principales (jornada · origen colegio). */

export type NivelInstitucion =
  | 'primaria'
  | 'secundaria'
  | 'tecnica'
  | 'tecnologica'
  | 'universidad';

export type PerfilInstitucion = 'estudiante' | 'profesor';

export const OPCIONES_TIPO_INSTITUCION: { value: NivelInstitucion; label: string }[] = [
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'tecnica', label: 'Técnica' },
  { value: 'tecnologica', label: 'Tecnológica' },
  { value: 'universidad', label: 'Universidad' },
];

export const OPCIONES_PERFIL_INSTITUCION: { value: PerfilInstitucion; label: string }[] = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'profesor', label: 'Profesor' },
];

export function normalizarNivelInstitucion(raw: string | null | undefined): NivelInstitucion {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (['primaria', 'secundaria', 'tecnica', 'tecnologica', 'universidad'].includes(t)) {
    return t as NivelInstitucion;
  }
  if (t === 'colegio') return 'secundaria';
  if (t === 'instituto') return 'tecnica';
  return 'secundaria';
}

export function esNivelBasicaMedia(nivel: string): boolean {
  const t = normalizarNivelInstitucion(nivel);
  return t === 'primaria' || t === 'secundaria';
}

export function esNivelSuperior(nivel: string): boolean {
  const t = normalizarNivelInstitucion(nivel);
  return t === 'tecnica' || t === 'tecnologica' || t === 'universidad';
}

export function opcionesGradoColegio(nivel: string): { value: string; label: string }[] {
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

export function opcionesSemestreInstitucion(): { value: string; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { value: String(n), label: `Semestre ${n}` };
  });
}

export function labelInstitucionPorNivel(nivel: string): string {
  const t = normalizarNivelInstitucion(nivel);
  if (t === 'primaria' || t === 'secundaria') return 'Institución *';
  if (t === 'tecnica') return 'Institución técnica *';
  if (t === 'tecnologica') return 'Institución tecnológica *';
  return 'Universidad / IES *';
}

export function limiteBusquedaColegios(nivel: string): number {
  return esNivelSuperior(nivel) ? 500 : 60;
}

export const OPCIONES_AREA_IMPARTE: { value: string; label: string }[] = [
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
