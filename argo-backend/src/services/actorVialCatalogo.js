const { models } = require('../models/catalogos');
const { ACTOR_VIAL_DEF } = require('../constants/actorVialCatalogo');

/** Si la colección está vacía, carga los 5 actores viales del esquema ARGO. */
async function ensureActorVialCatalogo() {
  const col = models.actorVial;
  if (!col) return 0;
  const n = await col.countDocuments();
  if (n > 0) return n;
  if (!ACTOR_VIAL_DEF.length) return 0;
  await col.insertMany(ACTOR_VIAL_DEF);
  return ACTOR_VIAL_DEF.length;
}

module.exports = { ensureActorVialCatalogo };
