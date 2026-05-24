const { Router } = require('express');
const ctrl = require('../controllers/egresoController');
const reciboEgreso = require('../controllers/reciboEgresoController');
const upload = require('../middleware/upload');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();
const soporte = upload.egresos.single('soporte');

router.use(requireAuth);

router.get('/admin/todos', requireAdmin, ctrl.listarTodos);
router.get('/formas-pago', ctrl.formasPago);
router.get('/', ctrl.listar);
router.get('/:id/recibo', reciboEgreso.datos);
router.get('/:id/recibo/html', reciboEgreso.html);
router.get('/:id', ctrl.obtener);
router.post('/', soporte, ctrl.crear);
router.put('/:id', soporte, ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
