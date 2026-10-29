const {
  normalizarOrigenJornadaCap,
  normalizarTipoInstitucionEducativa,
  normalizarPerfilInstitucionEducativa,
  normalizarAreaImparteColegio,
  esNivelBasicaMedia,
  esNivelSuperior,
} = require('../constants/origenJornadaCap');

const CAMPOS_ORIGEN_JORNADA = [
  'tipoInstitucionEducativa',
  'perfilInstitucionEducativa',
  'colegioCodigo',
  'colegioNombre',
  'gradoColegio',
  'semestreInstitucion',
  'titulacionCodigo',
  'areaImparteColegio',
  'programaInstitucion',
  'estamentoId',
  'estamentoNombre',
  'cargoEstamento',
  'dependenciaEstamento',
];

/**
 * Normaliza campos de origen en jornada sobre `dto` (mutación).
 * Misma lógica que pickAlumno en alumnoController.
 */
function aplicarOrigenJornadaCapEnDto(dto, body) {
  const origenJ = normalizarOrigenJornadaCap(
    body.origenJornadaCap || body.origenJornada || dto.origenJornadaCap,
  );
  if (!origenJ) return '';
  dto.origenJornadaCap = origenJ;
  if (origenJ === 'colegio') {
    const tipoInst =
      normalizarTipoInstitucionEducativa(body.tipoInstitucionEducativa || dto.tipoInstitucionEducativa) ||
      'secundaria';
    dto.tipoInstitucionEducativa = tipoInst;
    const perfil =
      normalizarPerfilInstitucionEducativa(
        body.perfilInstitucionEducativa || dto.perfilInstitucionEducativa,
      ) || 'estudiante';
    dto.perfilInstitucionEducativa = perfil;
    if (perfil === 'profesor') {
      const area =
        normalizarAreaImparteColegio(body.areaImparteColegio || dto.areaImparteColegio) ||
        String(body.areaImparteColegio || dto.areaImparteColegio || '')
          .trim()
          .toLowerCase();
      if (area) dto.areaImparteColegio = area;
      else delete dto.areaImparteColegio;
      delete dto.gradoColegio;
      delete dto.semestreInstitucion;
      delete dto.titulacionCodigo;
      delete dto.programaInstitucion;
    } else {
      delete dto.areaImparteColegio;
      if (esNivelBasicaMedia(tipoInst)) {
        const grado = parseInt(body.gradoColegio ?? dto.gradoColegio, 10);
        const minG = tipoInst === 'primaria' ? 1 : 6;
        const maxG = tipoInst === 'primaria' ? 5 : 11;
        if (Number.isFinite(grado) && grado >= minG && grado <= maxG) dto.gradoColegio = grado;
        else delete dto.gradoColegio;
        delete dto.semestreInstitucion;
        delete dto.titulacionCodigo;
        delete dto.programaInstitucion;
      } else if (esNivelSuperior(tipoInst)) {
        delete dto.gradoColegio;
        const sem = parseInt(body.semestreInstitucion ?? dto.semestreInstitucion, 10);
        if (Number.isFinite(sem) && sem >= 1 && sem <= 12) dto.semestreInstitucion = sem;
        else delete dto.semestreInstitucion;
        const titCod = String(body.titulacionCodigo ?? dto.titulacionCodigo ?? '').trim();
        if (titCod) dto.titulacionCodigo = titCod;
        else delete dto.titulacionCodigo;
      } else {
        delete dto.gradoColegio;
        delete dto.semestreInstitucion;
        delete dto.titulacionCodigo;
      }
    }
  } else {
    delete dto.tipoInstitucionEducativa;
    delete dto.perfilInstitucionEducativa;
    delete dto.colegioCodigo;
    delete dto.colegioNombre;
    delete dto.gradoColegio;
    delete dto.semestreInstitucion;
    delete dto.titulacionCodigo;
    delete dto.areaImparteColegio;
    delete dto.programaInstitucion;
  }
  if (origenJ !== 'estamento') {
    delete dto.estamentoId;
    delete dto.estamentoNombre;
    delete dto.cargoEstamento;
    delete dto.dependenciaEstamento;
  }
  return origenJ;
}

function vacio(v) {
  return v == null || String(v).trim() === '';
}

/** Valida payload de inscripción pública jornadas (400 si falta algo). */
function validarOrigenJornadaCapAlumno(alumno) {
  const oj = normalizarOrigenJornadaCap(alumno?.origenJornadaCap);
  if (!oj) {
    const err = new Error('Seleccione el origen del alumno en jornada');
    err.status = 400;
    throw err;
  }
  if (oj === 'colegio') {
    const tipoInst =
      normalizarTipoInstitucionEducativa(alumno?.tipoInstitucionEducativa) || 'secundaria';
    const perfil =
      normalizarPerfilInstitucionEducativa(alumno?.perfilInstitucionEducativa) || 'estudiante';
    if (vacio(alumno?.colegioNombre) && vacio(alumno?.colegioCodigo)) {
      const err = new Error('Seleccione la institución educativa');
      err.status = 400;
      throw err;
    }
    if (perfil === 'profesor') {
      if (vacio(alumno?.areaImparteColegio)) {
        const err = new Error('Seleccione el área que imparte');
        err.status = 400;
        throw err;
      }
    } else if (esNivelBasicaMedia(tipoInst)) {
      const g = Number(alumno?.gradoColegio);
      const minG = tipoInst === 'primaria' ? 1 : 6;
      const maxG = tipoInst === 'primaria' ? 5 : 11;
      if (!Number.isFinite(g) || g < minG || g > maxG) {
        const err = new Error(
          tipoInst === 'primaria'
            ? 'Seleccione el curso (1–5)'
            : 'Seleccione el grado (6–11)',
        );
        err.status = 400;
        throw err;
      }
    } else if (esNivelSuperior(tipoInst)) {
      const s = Number(alumno?.semestreInstitucion);
      if (!Number.isFinite(s) || s < 1 || s > 12) {
        const err = new Error('Seleccione el semestre (1–12)');
        err.status = 400;
        throw err;
      }
      if (vacio(alumno?.programaInstitucion) && vacio(alumno?.titulacionCodigo)) {
        const err = new Error('Seleccione la titulación / programa');
        err.status = 400;
        throw err;
      }
    }
  } else if (oj === 'estamento') {
    if (vacio(alumno?.estamentoId) && vacio(alumno?.estamentoNombre)) {
      const err = new Error('Seleccione el estamento público');
      err.status = 400;
      throw err;
    }
    if (vacio(alumno?.cargoEstamento)) {
      const err = new Error('Indique el cargo en el estamento');
      err.status = 400;
      throw err;
    }
    if (vacio(alumno?.dependenciaEstamento)) {
      const err = new Error('Indique la dependencia');
      err.status = 400;
      throw err;
    }
  } else if (oj === 'empresa') {
    if (vacio(alumno?.empresaId)) {
      const err = new Error('Seleccione la empresa del alumno');
      err.status = 400;
      throw err;
    }
  }
  return oj;
}

function copiarCamposOrigenDesdeEntrada(alumno, dto) {
  for (const k of [...CAMPOS_ORIGEN_JORNADA, 'origenJornadaCap']) {
    if (alumno?.[k] !== undefined && alumno?.[k] !== '') dto[k] = alumno[k];
  }
}

function limpiarCamposOrigenEnDocumento(doc, dtoNormalizado) {
  for (const k of CAMPOS_ORIGEN_JORNADA) {
    if (k in dtoNormalizado) doc[k] = dtoNormalizado[k];
    else doc[k] = undefined;
  }
}

module.exports = {
  CAMPOS_ORIGEN_JORNADA,
  aplicarOrigenJornadaCapEnDto,
  validarOrigenJornadaCapAlumno,
  copiarCamposOrigenDesdeEntrada,
  limpiarCamposOrigenEnDocumento,
};
