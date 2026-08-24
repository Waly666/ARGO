const { Router } = require('express');
const ctrl = require('../controllers/servicioController');
const { requireAuth, loadSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');

const router = Router();

router.use(requireAuth);
router.use(loadSedeActiva);

const acc = accionesModulo('servicios');

router.get('/', acc.ver, ctrl.listar);
router.post('/', acc.crear, ctrl.crear);
router.get('/:id', acc.ver, ctrl.obtener);
router.put('/:id', acc.editar, ctrl.actualizar);
router.delete('/:id', acc.eliminar, ctrl.eliminar);

module.exports = router;
