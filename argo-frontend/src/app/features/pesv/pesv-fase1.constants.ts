/** Títulos en lenguaje claro para pasos Res. 40595 (Fase 1). */
export const TITULO_PASO_40595: Record<number, string> = {
  1: 'Liderazgo y responsable del PESV',
  2: 'Comité de seguridad vial',
  3: 'Política de seguridad vial',
  4: 'Seguimiento de la alta dirección',
  5: 'Diagnóstico y línea base',
  6: 'Riesgos viales y matriz',
  7: 'Objetivos e indicadores',
  8: 'Programas críticos (velocidad, alcohol, etc.)',
  9: 'Plan anual de implementación',
  10: 'Competencias y capacitación',
  11: 'Comportamiento seguro y evaluación',
  12: 'Emergencias y respuesta',
  13: 'Investigación de accidentes',
  14: 'Vías internas y entorno',
  15: 'Viajes misionales',
  16: 'Inspección preoperacional',
  17: 'Mantenimiento y hoja de vida vehículos',
  18: 'Contratistas, terceros y cambio',
  19: 'Control documental',
  20: 'Indicadores y medición',
  21: 'Estadística de siniestros',
  22: 'Auditoría interna',
  23: 'Planes de acción',
  24: 'Comunicación del PESV',
};

export function tituloPaso40595(paso: number | null): string {
  if (paso == null) return 'Certificaciones del representante legal';
  return TITULO_PASO_40595[paso] ?? `Requisitos del paso ${paso}`;
}
