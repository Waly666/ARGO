const { Router } = require('express');
const ctrl = require('../controllers/matriculaController');
const { requireAuth, loadSedeActiva, exigirSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');

const router = Router();
router.use(requireAuth, loadSedeActiva, exigirSedeActiva);

const acc = accionesModulo('matriculas');

router.get('/revalidacion-preview', acc.ver, ctrl.previewRevalidacion);
router.get('/:id/cuotas-semestre', acc.ver, ctrl.obtenerCuotasSemestre);
router.patch('/:id/cuotas-semestre', acc.editar, ctrl.actualizarCuotasSemestre);
router.post('/', acc.crear, ctrl.crear);
router.get('/alumno/:numDoc', acc.ver, ctrl.listarPorAlumno);

module.exports = router;
