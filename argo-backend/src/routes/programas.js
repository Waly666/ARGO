const { Router } = require('express');
const ctrl = require('../controllers/programaController');
const { requireAuth, requireRole, requireGestionProgramas } = require('../middleware/auth');

const router = Router();
const gestion = requireGestionProgramas;

router.use(requireAuth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', gestion, ctrl.crear);
router.put('/:id', gestion, ctrl.actualizar);
router.delete('/:id', requireRole('admin'), ctrl.eliminar);

module.exports = router;
