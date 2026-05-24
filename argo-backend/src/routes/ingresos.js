const { Router } = require('express');
const ctrl = require('../controllers/ingresoController');
const recibo = require('../controllers/reciboController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/admin/todos', requireAdmin, ctrl.listarTodos);
router.get('/alumno/:numDoc', ctrl.listarPorAlumno);
router.get('/liquidacion/:idLiquidacion', ctrl.listarPorLiquidacion);
router.get('/:id/recibo', recibo.datos);
router.get('/:id/recibo/html', recibo.html);
router.post('/', ctrl.crear);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
