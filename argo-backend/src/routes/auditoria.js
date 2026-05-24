const { Router } = require('express');
const ctrl = require('../controllers/auditoriaController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/', ctrl.listar);
router.get('/:idAuditoria', ctrl.obtener);

module.exports = router;
