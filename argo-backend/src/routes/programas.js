const { Router } = require('express');
const ctrl = require('../controllers/programaController');
const { requireAuth, loadSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const { programasVirtual } = require('../middleware/upload');

const router = Router();

router.use(requireAuth);
router.use(loadSedeActiva);

const acc = accionesModulo('programas');
const accMat = accionesModulo('matriculas');

router.get('/', acc.ver, ctrl.listar);
router.get('/siguiente-codigo', acc.ver, ctrl.siguienteCodigo);
router.get('/:id/matriculas', accMat.ver, ctrl.matriculas);
router.get('/:id', acc.ver, ctrl.obtener);
router.post('/', acc.crear, ctrl.crear);
router.post(
  '/:id/portada-virtual',
  acc.editar,
  programasVirtual.single('portada'),
  ctrl.subirPortadaVirtual,
);
router.put('/:id', acc.editar, ctrl.actualizar);
router.delete('/:id', acc.eliminar, ctrl.eliminar);

module.exports = router;
