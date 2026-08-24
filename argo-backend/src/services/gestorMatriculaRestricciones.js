const { resolverAlcanceGestorMovil } = require('./alcanceGestorUsuario');
const { esProgramaCursoNoFormal } = require('./programaTipoCapacitacion');

async function assertGestorMatriculaProgramaPermitido(req, prog) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) return { alcance: null };
  if (!(await esProgramaCursoNoFormal(prog))) {
    const err = new Error(
      'Como gestor solo puede matricular cursos no formales. Seleccione un programa de ese tipo.',
    );
    err.status = 403;
    err.code = 'GESTOR_SOLO_CURSOS_NO_FORMALES';
    throw err;
  }
  return { alcance };
}

async function assertGestorSinServiciosAdicionalesMovil(req) {
  const alcance = await resolverAlcanceGestorMovil(req);
  if (!alcance?.activo) return { alcance: null };
  const err = new Error(
    'Como gestor no puede agregar servicios adicionales. Solo matrícula en cursos no formales.',
  );
  err.status = 403;
  err.code = 'GESTOR_SIN_SERVICIOS_ADICIONALES';
  throw err;
}

module.exports = {
  assertGestorMatriculaProgramaPermitido,
  assertGestorSinServiciosAdicionalesMovil,
};
