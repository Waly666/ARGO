const cron = require('node-cron');
const {
  procesarExpiracionesAcceso,
  procesarAvisosAccesoAlumno,
} = require('./aulaVirtualAccesoPlazo');

async function ejecutarCronAccesoPlazo() {
  try {
    const [exp, av] = await Promise.all([
      procesarExpiracionesAcceso(),
      procesarAvisosAccesoAlumno(),
    ]);
    if (exp.expirados > 0 || av.avisos > 0) {
      console.log(
        `[CRON aula-acceso-plazo] ${new Date().toISOString()} — expirados=${exp.expirados}, avisos=${av.avisos}`,
      );
    }
  } catch (err) {
    console.error('[CRON aula-acceso-plazo] Error:', err.message || err);
  }
}

function iniciarCronAulaVirtualAccesoPlazo() {
  ejecutarCronAccesoPlazo().catch(() => {});

  cron.schedule('30 1 * * *', () => {
    ejecutarCronAccesoPlazo().catch(() => {});
  });

  console.log('[CRON aula-acceso-plazo] Programado: todos los días a la 01:30 AM.');
}

module.exports = { iniciarCronAulaVirtualAccesoPlazo, ejecutarCronAccesoPlazo };
