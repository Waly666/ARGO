const { Router } = require('express');
const ctrl = require('../controllers/servicioController');
const { requireAuth, requireGestionProgramas } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);
router.get('/', ctrl.listar);
router.post('/', requireGestionProgramas, ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id', requireGestionProgramas, ctrl.actualizar);
router.delete('/:id', requireGestionProgramas, ctrl.eliminar);

module.exports = router;
