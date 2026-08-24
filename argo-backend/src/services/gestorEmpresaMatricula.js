const mongoose = require('mongoose');
const Gestor = require('../models/Gestor');
const { TARIFA_GESTOR, esTarifaComercial } = require('../constants/tarifa');
const { obtenerConfigGestoresEmpresas } = require('./configGestoresEmpresas');
const { num, valorTarifaServicio, listarServiciosMatricula } = require('./programaServicio');

/**
 * Si el alumno tiene manejo gestor/empresa activo, devuelve tarifa 5 o 6.
 * @returns {Promise<{ tarifa: number, tipoReferidor: string } | null>}
 */
async function resolverTarifaComercialAlumno({ alumno, prog, tarifaManual = false }) {
  if (tarifaManual) return null;
  const cfg = await obtenerConfigGestoresEmpresas();
  if (!cfg.activo || !alumno?.manejoGestorEmpresa) return null;

  const tipo = String(alumno.tipoReferidorComercial || '').trim().toLowerCase();
  let tarifa = null;
  if (tipo === 'gestor' && alumno.gestorId) tarifa = TARIFA_GESTOR;
  else return null;

  const servicios = await listarServiciosMatricula(prog);
  const usaSem = servicios.length > 1;
  const valor = usaSem
    ? servicios.reduce((acc, s) => acc + valorTarifaServicio(s, tarifa, prog), 0)
    : valorTarifaServicio(servicios[0], tarifa, prog);

  if (valor <= 0) {
    const err = new Error(
      'El programa no tiene tarifa gestor configurada (Programas → Matrícula)',
    );
    err.status = 400;
    err.code = 'TARIFA_COMERCIAL_NO_CONFIGURADA';
    throw err;
  }

  return { tarifa, tipoReferidor: tipo };
}

async function validarGestorEmpresaAlumno(dto) {
  const cfg = await obtenerConfigGestoresEmpresas();
  const manejo = dto.manejoGestorEmpresa === true;
  if (!manejo) {
    dto.manejoGestorEmpresa = false;
    dto.tipoReferidorComercial = null;
    dto.gestorId = null;
    dto.gestorNombre = null;
    dto.referidorEmpresaId = null;
    dto.referidorEmpresaNombre = null;
    return dto;
  }
  if (!cfg.activo) {
    const err = new Error('El manejo de gestores no está habilitado en Configuración');
    err.status = 400;
    throw err;
  }

  dto.manejoGestorEmpresa = true;
  dto.tipoReferidorComercial = 'gestor';
  dto.referidorEmpresaId = null;
  dto.referidorEmpresaNombre = null;

  const id = String(dto.gestorId || '').trim();
  if (!id || !mongoose.isValidObjectId(id)) {
    const err = new Error('Seleccione el gestor (tramitador) que trajo al alumno');
    err.status = 400;
    throw err;
  }
  const g = await Gestor.findOne({ _id: id, activo: { $ne: false } }).lean();
  if (!g) {
    const err = new Error('Gestor no encontrado o inactivo');
    err.status = 400;
    throw err;
  }
  dto.gestorId = g._id;
    dto.gestorNombre =
      String(g.seudonimo || '').trim() ||
      (String(g.tipoGestor || '').toLowerCase() === 'empresa'
        ? String(g.nombres || '').trim()
        : [g.nombres, g.apellidos].filter(Boolean).join(' ').trim()) ||
      String(g.numero || '');
  return dto;
}

/** Campos a guardar en matrícula/certificado: quién trajo al alumno en ESA matrícula. */
function snapshotReferidorComercial(alumno, tarifa) {
  const vacio = {
    referidorComercial: false,
    tipoReferidorComercial: null,
    gestorId: null,
    gestorNombre: null,
    referidorEmpresaId: null,
    referidorEmpresaNombre: null,
  };
  if (!esTarifaComercial(tarifa)) return vacio;

  const tipo = String(alumno?.tipoReferidorComercial || '').trim().toLowerCase();
  if (tipo === 'gestor' && alumno?.gestorId) {
    return {
      referidorComercial: true,
      tipoReferidorComercial: 'gestor',
      gestorId: alumno.gestorId,
      gestorNombre: alumno.gestorNombre || null,
      referidorEmpresaId: null,
      referidorEmpresaNombre: null,
    };
  }
  if (tipo === 'empresa' && alumno?.referidorEmpresaId) {
    return {
      referidorComercial: true,
      tipoReferidorComercial: 'empresa',
      gestorId: null,
      gestorNombre: null,
      referidorEmpresaId: alumno.referidorEmpresaId,
      referidorEmpresaNombre: alumno.referidorEmpresaNombre || null,
    };
  }
  return vacio;
}

function snapshotReferidorDesdeMatricula(mat) {
  if (!mat?.referidorComercial) {
    return {
      idMatricula: mat?._id || null,
      referidorComercial: false,
      tipoReferidorComercial: null,
      gestorId: null,
      gestorNombre: null,
      referidorEmpresaId: null,
      referidorEmpresaNombre: null,
    };
  }
  return {
    idMatricula: mat._id,
    referidorComercial: true,
    tipoReferidorComercial: mat.tipoReferidorComercial || null,
    gestorId: mat.gestorId || null,
    gestorNombre: mat.gestorNombre || null,
    referidorEmpresaId: mat.referidorEmpresaId || null,
    referidorEmpresaNombre: mat.referidorEmpresaNombre || null,
  };
}

/** Alumno gestionado por gestor (tramitador) comercial. */
function esAlumnoReferidorComercial(alumno) {
  if (!alumno?.manejoGestorEmpresa) return false;
  const tipo = String(alumno.tipoReferidorComercial || '').trim().toLowerCase();
  return tipo === 'gestor' && !!alumno.gestorId;
}

module.exports = {
  resolverTarifaComercialAlumno,
  validarGestorEmpresaAlumno,
  snapshotReferidorComercial,
  snapshotReferidorDesdeMatricula,
  esAlumnoReferidorComercial,
};
