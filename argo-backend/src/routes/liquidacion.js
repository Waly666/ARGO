const { Router } = require('express');
const ctrl = require('../controllers/liquidacionController');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/alumno/:numDoc', ctrl.listarPorAlumno);
router.get('/:id', ctrl.obtener);
router.post('/', ctrl.crear);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
