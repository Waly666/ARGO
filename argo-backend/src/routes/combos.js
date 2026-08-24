const { Router } = require('express');
const ctrl = require('../controllers/combosController');
const { requireAuth, loadSedeActiva, exigirSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');

const router = Router();
router.use(requireAuth);

const acc = accionesModulo('combos');

router.get('/', acc.ver, ctrl.listar);
router.get('/:id', acc.ver, ctrl.obtener);
router.get('/:id/prevista', acc.ver, ctrl.prevista);
router.post('/', acc.crear, ctrl.crear);
router.put('/:id', acc.editar, ctrl.actualizar);
router.delete('/:id', acc.eliminar, ctrl.eliminar);

router.post('/:id/aplicar', acc.crear, loadSedeActiva, exigirSedeActiva, ctrl.aplicar);

module.exports = router;
