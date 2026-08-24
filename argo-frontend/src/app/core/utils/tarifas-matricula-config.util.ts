/** Tarifa virtual (aula en línea). */
const TARIFA_VIRTUAL = 4;

export const TARIFAS_MATRICULA_CONFIG_OPCIONES = [
  { id: 1, label: 'Tarifa 1' },
  { id: 2, label: 'Tarifa 2' },
  { id: 3, label: 'Tarifa 3 (refrendación)' },
  { id: TARIFA_VIRTUAL, label: 'Tarifa virtual (aula en línea)' },
] as const;

export const TARIFAS_MATRICULA_CONFIG_DEFAULT = [1, 2, 3, TARIFA_VIRTUAL];

export function normalizarTarifasMatriculaConfig(raw?: number[] | null): number[] {
  if (!Array.isArray(raw) || !raw.length) return [...TARIFAS_MATRICULA_CONFIG_DEFAULT];
  const set = new Set<number>();
  for (const n of raw.map(Number)) {
    if (n === 1 || n === 2 || n === 3 || n === TARIFA_VIRTUAL) set.add(n);
  }
  return set.size ? [...set].sort((a, b) => a - b) : [...TARIFAS_MATRICULA_CONFIG_DEFAULT];
}

export function intersectarTarifasMatricula(programa: number[], config: number[]): number[] {
  const cfg = new Set(normalizarTarifasMatriculaConfig(config));
  return programa.filter((t) => cfg.has(t)).sort((a, b) => a - b);
}

export function tarifaMatriculaConfigActiva(tarifas: number[] | undefined, id: number): boolean {
  return normalizarTarifasMatriculaConfig(tarifas).includes(id);
}
