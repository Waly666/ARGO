const { Router } = require('express');
const ctrl = require('../controllers/referidorComercialController');
const { requireAuth, requirePermiso, loadSedeActiva } = require('../middleware/auth');

const router = Router();
router.use(requireAuth, loadSedeActiva);

const ver = requirePermiso('caja.turno', 'caja.admin', 'contabilidad');

router.get('/dashboard', ver, ctrl.dashboard);

module.exports = router;
