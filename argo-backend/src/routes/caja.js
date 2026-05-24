const { Router } = require('express');
const ctrl = require('../controllers/cajaSesionController');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/sesiones/activa', ctrl.activa);
router.get('/sesiones/activa/ingresos', ctrl.ingresosSesionActiva);
router.get('/sesiones/activa/egresos', ctrl.egresosSesionActiva);
router.get('/sesiones/abiertas', ctrl.listarAbiertas);
router.get('/sesiones', ctrl.listar);
router.get('/cierre-general/preview', ctrl.previewCierreGeneral);
router.get('/cierre-general', ctrl.listarCierresGenerales);
router.post('/cierre-general', ctrl.registrarCierreGeneral);
router.get('/sesiones/:idSesion/ingresos', ctrl.ingresosSesion);
router.get('/sesiones/:idSesion/egresos', ctrl.egresosSesion);
router.get('/sesiones/:idSesion/resumen', ctrl.resumen);
router.post('/sesiones/abrir', ctrl.abrir);
router.post('/sesiones/:idSesion/cerrar', ctrl.cerrar);

module.exports = router;
