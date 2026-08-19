const { Router } = require('express');
const ctrl = require('../controllers/gestorController');
const { requireAuth, requirePermiso } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth);

const ver = requirePermiso('caja.turno', 'caja.admin', 'caja.cobros', 'contabilidad');
const gestionar = requirePermiso('caja.turno', 'caja.admin', 'contabilidad');
const gestorFoto = upload.gestores.fields([{ name: 'foto', maxCount: 1 }]);

router.get('/catalogos', ver, ctrl.catalogos);
router.get('/', ver, ctrl.listar);
router.get('/:id', ver, ctrl.obtener);
router.post('/', gestionar, gestorFoto, ctrl.crear);
router.put('/:id', gestionar, gestorFoto, ctrl.actualizar);
router.delete('/:id', gestionar, ctrl.eliminar);

module.exports = router;
