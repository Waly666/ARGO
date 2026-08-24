const { Router } = require('express');
const ctrl = require('../controllers/liquidacionController');
const { requireAuth, loadSedeActiva, exigirSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');

const router = Router();
router.use(requireAuth, loadSedeActiva, exigirSedeActiva);

const acc = accionesModulo('liquidaciones');

router.get('/con-saldo', acc.ver, ctrl.listarConSaldo);
router.get('/alumno/:numDoc', acc.ver, ctrl.listarPorAlumno);
router.get('/:id', acc.ver, ctrl.obtener);
router.post('/', acc.crear, ctrl.crear);
router.delete('/:id', acc.eliminar, ctrl.eliminar);

module.exports = router;
