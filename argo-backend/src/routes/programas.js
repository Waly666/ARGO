const { Router } = require('express');
const ctrl = require('../controllers/programaController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

const ver = requirePermiso('programas.ver', 'programas.gestionar', 'programas.agregar');
const agregar = requirePermiso('programas.agregar', 'programas.gestionar');
const gestionar = requirePermiso('programas.gestionar');

router.get('/', ver, ctrl.listar);
router.get('/:id', ver, ctrl.obtener);
router.post('/', agregar, ctrl.crear);
router.put('/:id', gestionar, ctrl.actualizar);
router.delete('/:id', gestionar, ctrl.eliminar);

module.exports = router;
