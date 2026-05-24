const { Router } = require('express');
const ctrl = require('../controllers/usuarioController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/roles', ctrl.roles);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id/permanente', ctrl.borrar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
