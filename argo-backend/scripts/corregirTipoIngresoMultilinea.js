/**
 * Corrige el tipo de ingreso guardado en comprobantes de varios servicios.
 * Esos recibos quedaron con el tipo del primer ítem (a menudo Técnicos).
 *
 * Simulación (no escribe):
 *   node scripts/corregirTipoIngresoMultilinea.js
 * Aplicar:
 *   node scripts/corregirTipoIngresoMultilinea.js --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Ingreso = require('../src/models/Ingreso');
const { resolverTipoIngresoPredominante } = require('../src/services/tipoIngresoResolver');

const apply = process.argv.includes('--apply');

function normalizar(txt) {
  return String(txt ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function num(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v.$numberDecimal != null) return Number(v.$numberDecimal) || 0;
  if (typeof v === 'object' && typeof v.toString === 'function') {
    const n = Number(v.toString());
    if (Number.isFinite(n)) return n;
  }
  return Number(v) || 0;
}

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/argo';
  await mongoose.connect(uri);

  const rows = await Ingreso.find({
    'detalle.1': { $exists: true },
    ingresoCaja: { $ne: true },
    origenMigracion: { $ne: true },
  })
    .select('numRecibo detalle tipoIngreso idTipoIngreso')
    .lean();

  const cambios = [];
  let sinTipo = 0;
  let iguales = 0;
  let omitidosMigracion = 0;

  for (const ing of rows) {
    if (normalizar(ing.tipoIngreso) === 'MIGRACION') {
      omitidosMigracion += 1;
      continue;
    }
    const tipoDoc = await resolverTipoIngresoPredominante(
      (ing.detalle || []).map((d) => ({
        idLiquidacion: d.idLiquidacion,
        valor: num(d.valor),
      })),
    );
    if (!tipoDoc?.tipo) {
      sinTipo += 1;
      continue;
    }
    const antes = String(ing.tipoIngreso || '').trim() || '(vacío)';
    if (normalizar(antes) === normalizar(tipoDoc.tipo)) {
      iguales += 1;
      continue;
    }
    cambios.push({
      id: ing._id,
      recibo: ing.numRecibo || String(ing._id),
      antes,
      despues: tipoDoc.tipo,
      idTipoIngreso: tipoDoc.idTipoIngreso != null ? String(tipoDoc.idTipoIngreso) : null,
    });
  }

  if (apply) {
    for (const c of cambios) {
      const update = { $set: { tipoIngreso: c.despues } };
      if (c.idTipoIngreso) update.$set.idTipoIngreso = c.idTipoIngreso;
      else update.$unset = { idTipoIngreso: '' };
      await Ingreso.updateOne({ _id: c.id }, update);
    }
  }

  const muestra = cambios.slice(0, 40).map((c) => `${c.recibo}: ${c.antes} → ${c.despues}`);
  console.log(
    JSON.stringify(
      {
        modo: apply ? 'aplicado' : 'simulacion',
        comprobantesVariosServicios: rows.length,
        omitidosMigracion,
        yaEstabanBien: iguales,
        sinTipoResuelto: sinTipo,
        aCorregir: cambios.length,
        muestra,
        aviso:
          cambios.length > muestra.length
            ? `Hay ${cambios.length - muestra.length} cambios más que no se listan aquí.`
            : undefined,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
