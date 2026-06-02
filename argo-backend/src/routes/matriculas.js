const { Router } = require('express');
const ctrl = require('../controllers/matriculaController');
const { requireAuth, loadSedeActiva, exigirSedeActiva, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth, loadSedeActiva, exigirSedeActiva);

const pagos = requirePermiso('alumnos.pagos', 'alumnos.gestionar');

router.post('/', pagos, ctrl.crear);
router.get('/alumno/:numDoc', pagos, ctrl.listarPorAlumno);

module.exports = router;
