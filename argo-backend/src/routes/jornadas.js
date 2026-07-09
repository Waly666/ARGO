const { Router } = require('express');
const ctrl = require('../controllers/jornadaCapController');
const sup = require('../controllers/supervisorController');
const upload = require('../middleware/upload');
const { loadClaseParaEvidencia } = require('../middleware/jornadaEvidenciaCap');
const { soloCertificadoJornada } = require('../middleware/certificadoJornada');
const certRender = require('../controllers/certificadoRenderController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const ver = requirePermiso('jornadas.ver', 'jornadas.gestionar');
const gest = requirePermiso('jornadas.gestionar');
const cobro = requirePermiso('jornadas.gestionar', 'facturacion');
const operar = requirePermiso('jornadas.operar', 'jornadas.gestionar');
const fotoEvidenciaClase = upload.evidenciasCap.single('foto');
const soporteIngresoContrato = upload.ingresos.single('soporte');

router.get('/supervisores', ver, sup.listar);
router.post('/supervisores', gest, sup.crear);
router.put('/supervisores/:id', gest, sup.actualizar);

router.get('/contratos', ver, ctrl.listarContratos);
router.get('/contratos/:id/avance', ver, ctrl.avanceContrato);
router.get('/contratos/:id', ver, ctrl.obtenerContrato);
router.post('/contratos', gest, ctrl.crearContrato);
router.put('/contratos/:id', gest, ctrl.actualizarContrato);
router.delete('/contratos/:id', gest, ctrl.eliminarContrato);
router.post('/contratos/:id/generar-jornadas', gest, ctrl.generarJornadas);
router.post('/contratos/:id/jornadas', gest, ctrl.crearJornadaContrato);
router.post('/contratos/:id/finalizar', gest, ctrl.finalizarContrato);
router.get('/contratos/:id/cobro', ver, ctrl.estadoCobroContrato);
router.post('/contratos/:id/cuenta-cobro/generar', cobro, ctrl.generarCuentaCobroContrato);
router.get('/contratos/:id/cuenta-cobro/html', ver, ctrl.htmlCuentaCobroContrato);
router.post('/contratos/:id/comprobantes-ingreso', cobro, soporteIngresoContrato, ctrl.generarComprobanteIngresoContrato);
router.get('/programas-jornada', ver, ctrl.programasJornadaCap);
router.get('/instructores', ver, ctrl.listarInstructores);

router.get('/config/operacion', gest, ctrl.obtenerConfigOperacionJornadas);
router.get('/config/operacion/estado', ver, ctrl.estadoOperacionEspecialJornadas);
router.put('/config/operacion', gest, ctrl.actualizarConfigOperacionJornadas);

router.get('/jornadas/georef/municipio', gest, ctrl.resolverMunicipioGeoref);
router.get('/jornadas/del-dia', operar, ctrl.jornadasDelDia);
router.get('/jornadas/en-proceso', ver, ctrl.jornadasEnProceso);
router.get('/jornadas', ver, ctrl.listarJornadas);
router.patch('/jornadas/:id', gest, ctrl.actualizarJornada);
router.post('/jornadas/:id/cerrar-operacion', gest, ctrl.cerrarJornadaOperacion);
router.post('/jornadas/:id/reabrir-operacion', gest, ctrl.reabrirJornadaOperacion);
router.delete('/jornadas/:id', gest, ctrl.eliminarJornada);

router.get('/clases', ver, ctrl.listarClases);
router.get('/clases/del-dia', ver, ctrl.clasesDelDia);
router.get('/clases/:id', ver, ctrl.obtenerClase);
router.post('/clases', operar, ctrl.crearClase);
router.patch('/clases/:id', operar, ctrl.actualizarClase);
router.delete('/clases/:id', gest, ctrl.eliminarClase);
router.post('/clases/:id/iniciar', operar, ctrl.iniciarClase);
router.post('/clases/:id/finalizar', operar, ctrl.finalizarClase);
router.post('/clases/:id/sincronizar-asistencias', operar, ctrl.sincronizarAsistenciasInscritos);
router.post(
  '/clases/:id/foto-evidencia',
  operar,
  loadClaseParaEvidencia,
  fotoEvidenciaClase,
  ctrl.subirFotoEvidenciaClase,
);
router.post('/clases/:id/asistencia', operar, ctrl.registrarAsistencia);
router.delete('/clases/:id/asistencias/:numDoc', operar, ctrl.eliminarAsistenciaAlumno);
router.get('/clases/:id/asistencias', ver, ctrl.listarAsistenciasClase);
router.get('/clases/:id/inscritos', ver, ctrl.inscritosClase);
router.get('/clases/:id/inscritos-clase-anterior', ver, ctrl.alumnosClaseAnterior);
router.delete('/clases/:id/inscritos/:numDoc', operar, ctrl.quitarInscripcionClase);

router.get('/informes', ver, ctrl.informesJornada);
router.get('/informes/export', ver, ctrl.exportarInformesJornada);

router.get('/certificados-generados', ver, ctrl.certificadosGenerados);
router.get('/certificados-generados/:id/html', ver, soloCertificadoJornada, certRender.html);
router.patch('/certificados-generados/:id', gest, soloCertificadoJornada, ctrl.actualizarCertificadoGenerado);
router.delete('/certificados-generados/:id', gest, soloCertificadoJornada, ctrl.eliminarCertificadoGenerado);
router.get('/alumnos', operar, ctrl.buscarAlumnos);
router.post('/matricular', operar, ctrl.matricularAlumnoJornada);
router.get('/alumnos/doc/:numDoc', operar, ctrl.buscarAlumnoDoc);
router.get('/alumnos/:numDoc/progreso-cert', operar, ctrl.progresoAlumnoContrato);

module.exports = router;
