const { models: cat } = require('../models/catalogos');
const { cargarIndiceTipCap, resolverIdTipCapCanonico } = require('./tipoCapacitacionMatch');
const { esCapJornadaCapacitacion } = require('./clasificacionCertificado');
const DatosAlumno = require('../models/DatosAlumno');
const Contratacion = require('../models/Contratacion');
const { parseNumDoc, numDocQuery } = require('../utils/numDoc');
const { TIPO_JORNADAS_CAPACITACION } = require('../constants/tipoRegularJornada');
const { normalizarTipoAlumno, TIPO_ALUMNO_DEFAULT } = require('../constants/tipoAlumno');
const { asegurarSedePrincipal, ID_SEDE_PRINCIPAL } = require('./sedeContext');

const RE_PROG_JORNADA = /jornadas?\s*de\s*capacitaci[oó]n/i;

async function etiquetaTipCap(idTipCap) {
  if (idTipCap == null || idTipCap === '') return '';
  const indice = await cargarIndiceTipCap();
  const canon = resolverIdTipCapCanonico(idTipCap, indice);
  const row = indice.rows.find((r) => {
    const id = String(r.idTipCap ?? r.id ?? '').trim();
    const c = id.match(/^(\d+)/) ? id.match(/^(\d+)/)[1] : id;
    return c === canon || id === String(idTipCap);
  });
  return String(row?.tipoCap || row?.descripcion || row?.nombre || '').trim();
}

async function esProgramaJornadasCap(prog) {
  if (!prog) return false;
  const tc = String(prog.tipoCertificado || '').toLowerCase().replace(/-/g, '_');
  if (tc === 'jornada_capacitacion') return true;
  const label = await etiquetaTipCap(prog.idTipCap);
  if (esCapJornadaCapacitacion(label) || RE_PROG_JORNADA.test(label)) return true;
  const raw = String(prog.idTipCap ?? '');
  if (RE_PROG_JORNADA.test(raw) || esCapJornadaCapacitacion(raw)) return true;
  return false;
}

function auditoriaUsuario(req) {
  return req?.user?.usuario || req?.user?.email || req?.user?.nombre || 'sistema';
}

/** Pasa alumno de Regular a Jornadas de Capacitación al operar en el módulo jornadas. */
async function asegurarTipoAlumnoJornada(numDoc) {
  const al = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  if (!al) return null;
  const actual = normalizarTipoAlumno(al.tipoAlumno);
  if (actual === TIPO_JORNADAS_CAPACITACION) return al;
  await DatosAlumno.updateOne(
    { _id: al._id },
    { $set: { tipoAlumno: TIPO_JORNADAS_CAPACITACION } },
  );
  return { ...al, tipoAlumno: TIPO_JORNADAS_CAPACITACION };
}

/**
 * Asigna al alumno la empresa del contrato (idClienteFacturacion → empresaId).
 * Se aplica al matricular/inscribir en jornadas para trazabilidad por cliente contratante.
 */
async function asignarEmpresaContratoAlumno(numDoc, idContrato, userLogin = 'sistema') {
  if (!idContrato) return { empresaId: null, actualizado: false };
  const nd = typeof numDoc === 'number' ? numDoc : parseNumDoc(numDoc);
  if (nd == null) return { empresaId: null, actualizado: false };

  const contrato = await Contratacion.findById(idContrato).select('idClienteFacturacion').lean();
  if (!contrato?.idClienteFacturacion) return { empresaId: null, actualizado: false };

  const empresaId = contrato.idClienteFacturacion;
  const al = await DatosAlumno.findOne(numDocQuery(nd));
  if (!al) return { empresaId: String(empresaId), actualizado: false };

  const actual = al.empresaId ? String(al.empresaId) : '';
  const nuevo = String(empresaId);
  if (actual === nuevo) return { empresaId: nuevo, actualizado: false };

  await DatosAlumno.updateOne(
    { _id: al._id },
    {
      $set: {
        empresaId,
        userChangeRecord: userLogin,
        fechaMod: new Date(),
      },
    },
  );
  return { empresaId: nuevo, actualizado: true };
}

/** Matrículas/liquidaciones de jornada van siempre a la sede principal (operación móvil, sin sede física). */
async function resolverIdSedeMatriculaJornada() {
  const principal = await asegurarSedePrincipal();
  return principal?.idSede || ID_SEDE_PRINCIPAL;
}

module.exports = {
  esProgramaJornadasCap,
  etiquetaTipCap,
  auditoriaUsuario,
  asegurarTipoAlumnoJornada,
  asignarEmpresaContratoAlumno,
  resolverIdSedeMatriculaJornada,
  TIPO_JORNADAS_CAPACITACION,
  TIPO_ALUMNO_DEFAULT,
};
