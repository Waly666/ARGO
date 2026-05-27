const { Router } = require('express');
const ctrl = require('../controllers/programacionCeaController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const ver = requirePermiso('programacion_cea.ver', 'programacion_cea.gestionar', 'programacion_cea.operar');
const gest = requirePermiso('programacion_cea.gestionar');
const operar = requirePermiso('programacion_cea.operar', 'programacion_cea.gestionar');

router.get('/programas', ver, ctrl.programas);
router.get('/config', ver, ctrl.obtenerConfig);
router.put('/config', gest, ctrl.guardarConfig);
router.get('/festivos', ver, ctrl.festivos);

router.get('/temas/:idProg', ver, ctrl.listarTemas);
router.post('/temas/:idProg', gest, ctrl.crearTema);
router.put('/temas/item/:id', gest, ctrl.actualizarTema);
router.delete('/temas/item/:id', gest, ctrl.eliminarTema);

router.get('/rastreo', ver, ctrl.rastreoGlobal);
router.get('/rastreo/:numDoc', ver, ctrl.rastreoAlumno);
router.get('/alertas-pendientes', ver, ctrl.alertasPendientes);

router.get('/recursos', ver, ctrl.recursos);
router.get('/clases', ver, ctrl.listarClases);
router.post('/clases/verificar-conflictos', gest, ctrl.verificarConflictos);
router.post('/clases', gest, ctrl.crearClase);
router.get('/clases/:id', ver, ctrl.obtenerClase);
router.put('/clases/:id', gest, ctrl.actualizarClase);
router.delete('/clases/:id', gest, ctrl.cancelarClase);
router.post('/clases/:id/iniciar', operar, ctrl.iniciarClase);
router.post('/clases/:id/finalizar', operar, ctrl.finalizarClase);
router.get('/clases/:id/inscripciones', ver, ctrl.listarInscripciones);
router.get('/clases/:id/alumnos-elegibles', ver, ctrl.alumnosElegibles);
router.post('/clases/:id/inscribir', operar, ctrl.inscribirAlumno);
router.delete('/clases/:id/inscripciones/:numDoc', operar, ctrl.quitarInscripcion);

module.exports = router;
