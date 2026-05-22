const { Router } = require('express');
const ctrl = require('../controllers/matriculaController');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.post('/', ctrl.crear);
router.get('/alumno/:numDoc', ctrl.listarPorAlumno);

module.exports = router;
