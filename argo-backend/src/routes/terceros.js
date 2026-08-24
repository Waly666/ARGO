const { Router } = require('express');
const ctrl = require('../controllers/terceroController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const ver = requirePermiso('caja.admin', 'caja.cobros', 'contabilidad');
const gestionar = requirePermiso('caja.admin', 'contabilidad');

router.get('/catalogos', ver, ctrl.catalogos);
router.get('/', ver, ctrl.listar);
router.get('/:id', ver, ctrl.obtener);
router.post('/', gestionar, ctrl.crear);
router.put('/:id', gestionar, ctrl.actualizar);
router.delete('/:id', gestionar, ctrl.eliminar);

module.exports = router;
