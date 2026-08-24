const { Router } = require('express');
const ctrl = require('../controllers/autorizacionOperacionController');
const { requireAuth, loadSedeActiva, requirePermiso } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');

const router = Router();
router.use(requireAuth, loadSedeActiva);

const adminAut = requirePermiso('config.autorizaciones', 'config.roles');

router.get('/pendientes/count', adminAut, ctrl.contarPendientes);
router.get('/alertas/admin', adminAut, ctrl.listarAlertasAdmin);
router.get('/alertas/mias', ctrl.listarMisAlertas);
router.get('/', adminAut, ctrl.listar);
router.get('/:idSolicitud', requireAuth, ctrl.obtener);
router.post('/solicitar', ctrl.solicitar);
router.post('/:idSolicitud/marcar-vista', ctrl.marcarVista);
router.post('/:idSolicitud/rechazar', adminAut, ctrl.rechazar);
router.post('/:idSolicitud/autorizar', adminAut, ctrl.autorizar);

module.exports = router;
module.exports.accionesModulo = accionesModulo;
