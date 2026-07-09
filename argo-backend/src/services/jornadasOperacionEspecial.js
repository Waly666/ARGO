const { obtenerConfigJornadasOperacion } = require('./configJornadasOperacion');
const { tieneAlguno, permisosParaRol } = require('./rolesPermisos');
const {
  mensajeSiJornadaNoOperable,
  mensajeSiJornadaNoIniciableClase,
  mensajeSiJornadaNoDisponibleParaClase,
} = require('./estadoJornadaCap');

async function estadoOperacionEspecialJornadas(req) {
  const cfg = await obtenerConfigJornadasOperacion();
  const permisos =
    req?.permisos || (req?.user?.rol ? await permisosParaRol(req.user.rol) : []);
  const puedeGestionar = tieneAlguno(permisos, ['jornadas.gestionar']);
  const habilitada = cfg.operacionFueraDeDiaHabilitada === true;
  const puedeUsar = habilitada && puedeGestionar;
  let motivo = null;
  if (!habilitada) {
    motivo = 'Active la operación fuera del día en Configuración → Jornadas.';
  } else if (!puedeGestionar) {
    motivo = 'Requiere permiso jornadas.gestionar.';
  }
  return {
    operacionFueraDeDiaHabilitada: habilitada,
    puedeUsar,
    motivo,
  };
}

async function operacionFueraDeDiaActiva(req) {
  const st = await estadoOperacionEspecialJornadas(req);
  return st.puedeUsar === true;
}

async function bloqueoOperacionJornada(req, jornada) {
  if (await operacionFueraDeDiaActiva(req)) return null;
  return mensajeSiJornadaNoOperable(jornada);
}

async function bloqueoIniciarClaseJornada(req, jornada) {
  if (await operacionFueraDeDiaActiva(req)) return null;
  return mensajeSiJornadaNoIniciableClase(jornada);
}

async function bloqueoCrearClaseJornada(req, jornada) {
  if (await operacionFueraDeDiaActiva(req)) return null;
  return mensajeSiJornadaNoDisponibleParaClase(jornada);
}

module.exports = {
  estadoOperacionEspecialJornadas,
  operacionFueraDeDiaActiva,
  bloqueoOperacionJornada,
  bloqueoIniciarClaseJornada,
  bloqueoCrearClaseJornada,
};
