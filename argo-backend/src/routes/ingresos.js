const { Router } = require('express');
const ctrl = require('../controllers/ingresoController');
const recibo = require('../controllers/reciboController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const pagos = requirePermiso('alumnos.pagos', 'caja.turno', 'caja.cobros');
const admin = requirePermiso('caja.admin');

router.get('/admin/todos', admin, ctrl.listarTodos);
router.get('/alumno/:numDoc', pagos, ctrl.listarPorAlumno);
router.get('/liquidacion/:idLiquidacion', pagos, ctrl.listarPorLiquidacion);
router.get('/:id/recibo', pagos, recibo.datos);
router.get('/:id/recibo/html', pagos, recibo.html);
router.post('/', pagos, ctrl.crear);
router.delete('/:id', pagos, ctrl.eliminar);

module.exports = router;
