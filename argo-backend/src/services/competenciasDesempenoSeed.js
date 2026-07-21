const CompetenciaDesempeno = require('../models/CompetenciaDesempeno');
const Cargo = require('../models/Cargo');
const { COMPETENCIAS_DEFAULT } = require('../constants/competenciasDesempenoDefault');

/** Patrones para mapear ámbito legacy → cargos del catálogo. */
const AMBITO_CARGO_PATTERNS = {
  instructor: /instructor|docente|profesor|pedagog/i,
  cajero: /cajero|caja|recepcion|ventanilla|atenci[oó]n/i,
};

function cargosIdsPorAmbito(ambito, cargos) {
  const key = String(ambito || 'todos').toLowerCase().trim();
  if (!key || key === 'todos' || key === 'general') return [];
  const re = AMBITO_CARGO_PATTERNS[key];
  if (!re) return [];
  return (cargos || [])
    .filter((c) => re.test(String(c.nombre || '')))
    .map((c) => Number(c.idCargo))
    .filter((n) => Number.isFinite(n));
}

async function listarCargosActivos() {
  return Cargo.find({
    $or: [{ estado: { $in: [/^activo$/i, 'activo', 'ACTIVO', 'Activo', null] } }, { estado: { $exists: false } }],
  })
    .select({ idCargo: 1, nombre: 1 })
    .lean();
}

/** Migra registros con ámbito texto (instructor/cajero) a cargosIds. */
async function migrarAmbitoLegacyACargos() {
  const pendientes = await CompetenciaDesempeno.find({
    $or: [
      { cargosIds: { $exists: false } },
      { cargosIds: null },
      {
        cargosIds: { $size: 0 },
        ambito: { $in: ['instructor', 'cajero', 'Instructor', 'Cajero'] },
      },
    ],
  }).lean();
  if (!pendientes.length) return { migrated: 0 };

  const cargos = await listarCargosActivos();
  let migrated = 0;
  for (const row of pendientes) {
    const ids = cargosIdsPorAmbito(row.ambito, cargos);
    // Si ya es transversal (todos/general) y cargosIds vacío, solo asegura campos.
    const ambitoNorm = String(row.ambito || 'todos').toLowerCase();
    if ((ambitoNorm === 'todos' || ambitoNorm === 'general') && (!row.cargosIds || !row.cargosIds.length)) {
      await CompetenciaDesempeno.updateOne(
        { _id: row._id },
        { $set: { cargosIds: [], ambito: 'todos', updatedAt: new Date() } },
      );
      migrated += 1;
      continue;
    }
    await CompetenciaDesempeno.updateOne(
      { _id: row._id },
      {
        $set: {
          cargosIds: ids,
          ambito: ids.length ? 'cargos' : (ambitoNorm === 'todos' || ambitoNorm === 'general' ? 'todos' : row.ambito),
          updatedAt: new Date(),
        },
      },
    );
    migrated += 1;
  }
  return { migrated };
}

/** Si el catálogo está vacío, inserta el listado base. */
async function asegurarCompetenciasDefault() {
  await migrarAmbitoLegacyACargos();

  const n = await CompetenciaDesempeno.countDocuments();
  if (n > 0) return { seeded: false, total: n };

  const cargos = await listarCargosActivos();
  const user = 'sistema';
  const now = new Date();
  let id = 0;
  for (const c of COMPETENCIAS_DEFAULT) {
    id += 1;
    const cargosIds = cargosIdsPorAmbito(c.ambito, cargos);
    await CompetenciaDesempeno.create({
      idCompetencia: id,
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      cargosIds,
      ambito: cargosIds.length ? 'cargos' : 'todos',
      orden: c.orden ?? id * 10,
      estado: 'activo',
      createdAt: now,
      updatedAt: now,
      userAddReg: user,
      userChangeRecord: user,
    });
  }
  return { seeded: true, total: COMPETENCIAS_DEFAULT.length };
}

module.exports = {
  asegurarCompetenciasDefault,
  migrarAmbitoLegacyACargos,
  cargosIdsPorAmbito,
  COMPETENCIAS_DEFAULT,
};
