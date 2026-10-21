/** Catálogo Fase 2 SISI-PESV (4 pestañas). Metodología paso #20 y relacionados. */

const MESES_TRIMESTRE_SINIESTROS = [3, 6, 9, 12];

const FASE2_TABS = [
  { id: 'siniestros', label: 'A. Siniestros', periodicidad: 'trimestral', mesesCarga: MESES_TRIMESTRE_SINIESTROS },
  { id: 'administrativo', label: 'B. Administrativo', periodicidad: 'trimestral', mesesCarga: MESES_TRIMESTRE_SINIESTROS },
  { id: 'funcionamiento', label: 'C. Funcionamiento', periodicidad: 'mensual', mesesCarga: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'vehiculos', label: 'D. Vehículos', periodicidad: 'mensual', mesesCarga: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
];

const VARIABLES_FUNCIONAMIENTO = [
  { id: '6.1', label: 'Excesos jornada diaria conductores (mes)', tipo: 'entero' },
  { id: '6.2', label: 'Total días trabajados por todos los conductores', tipo: 'entero' },
  { id: '8.1', label: 'Viajes laborales con exceso de velocidad (mes)', tipo: 'entero' },
  { id: '8.2', label: 'Total viajes laborales', tipo: 'entero' },
];

const EVIDENCIAS_FUNCIONAMIENTO = [
  {
    id: 'c1',
    label: 'Certificación Rep. Legal límites de velocidad por sede/ruta',
    tipo: 'pdf',
    maxMb: 15,
  },
  {
    id: 'c2',
    label: 'Informe mensual líder PESV al comité (viajes, multas, mediciones)',
    tipo: 'pdf',
    maxMb: 15,
  },
];

const VARIABLES_VEHICULOS = [
  { id: '7.1', label: 'Vehículos propios en programa de velocidad', tipo: 'entero' },
  { id: '7.2', label: 'Vehículos propios usados en desplazamientos laborales', tipo: 'entero' },
  { id: '7.3', label: 'Vehículos contratistas en programa de velocidad', tipo: 'entero' },
  { id: '7.4', label: 'Vehículos contratistas en desplazamientos laborales', tipo: 'entero' },
  { id: '7.5', label: 'Vehículos terceros en programa de velocidad', tipo: 'entero' },
  { id: '7.6', label: 'Vehículos terceros en desplazamientos laborales', tipo: 'entero' },
  { id: '9.1', label: 'Vehículos inspeccionados diariamente (agregado mes)', tipo: 'entero' },
  { id: '9.2', label: 'Vehículos que operan diariamente', tipo: 'entero' },
];

const EVIDENCIAS_VEHICULOS = [
  { id: 'd1', label: 'Informe mensual líder PESV (programa velocidad)', tipo: 'pdf', maxMb: 15 },
  { id: 'd2', label: 'Cantidad desplazamientos laborales en vehículos', tipo: 'entero' },
  { id: 'd3', label: 'Cantidad desplazamientos medidos', tipo: 'entero' },
  { id: 'd4', label: 'Relación infracciones de tránsito', tipo: 'xlsx', maxMb: 15 },
  { id: 'd5', label: 'Llamados de atención en instalaciones', tipo: 'entero' },
  { id: 'd6', label: 'Relación inspecciones preoperativas', tipo: 'xlsx', maxMb: 15 },
  { id: 'd7', label: 'Muestra formatos inspección diaria (10% parque)', tipo: 'pdf', maxMb: 15 },
  { id: 'd8', label: 'Vehículos con fallas reportadas en el mes', tipo: 'entero' },
];

const SINIESTROS_EVIDENCIA = {
  id: 'a1',
  label: 'Registro de siniestros (plantilla Excel SISI)',
  tipo: 'xlsx',
  maxMb: 50,
  columnas: [
    'Fecha del siniestro',
    'Nivel de pérdida',
    'Personas implicadas por nivel',
    'Placa vehículo empresa',
    'Nombre conductor',
    'Identificación conductor',
    'Consecutivo IPAT',
    'Organismo de tránsito IPAT',
    'Fecha comité de análisis',
  ],
};

/** Variables administrativas: se completan según periodo en portal ST; reservamos estructura genérica. */
const ADMINISTRATIVO_PLACEHOLDER = {
  nota: 'Indicadores trimestrales según GCI-FR-006; cargar valores al abrir mes mar/jun/sep/dic.',
  variables: [],
};

function mesPermiteCarga(tabId, mes) {
  const tab = FASE2_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  return tab.mesesCarga.includes(Number(mes));
}

module.exports = {
  FASE2_TABS,
  MESES_TRIMESTRE_SINIESTROS,
  VARIABLES_FUNCIONAMIENTO,
  EVIDENCIAS_FUNCIONAMIENTO,
  VARIABLES_VEHICULOS,
  EVIDENCIAS_VEHICULOS,
  SINIESTROS_EVIDENCIA,
  ADMINISTRATIVO_PLACEHOLDER,
  mesPermiteCarga,
};
