const { Router } = require('express');
const ctrl = require('../controllers/ingresoController');
const recibo = require('../controllers/reciboController');
const upload = require('../middleware/upload');
const { requireAuth, requirePermiso, loadSedeActiva, exigirSedeActiva } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const contratoMutable = require('../middleware/contratoJornadaMutable');

const router = Router();
router.use(requireAuth, loadSedeActiva, exigirSedeActiva);

const accIng = accionesModulo('ingresos');
const admin = requirePermiso('caja.admin', 'contabilidad');
const soporte = upload.ingresos.single('soporte');

router.get('/admin/todos', admin, ctrl.listarTodos);
router.get('/alumno/:numDoc', accIng.ver, ctrl.listarPorAlumno);
router.get('/liquidacion/:idLiquidacion', accIng.ver, ctrl.listarPorLiquidacion);
router.get('/:id/recibo', accIng.ver, recibo.datos);
router.get('/:id/recibo/html', accIng.ver, recibo.html);
router.post('/', accIng.crear, soporte, contratoMutable.contratoPorBodyOpcional, ctrl.crear);
router.delete('/:id', accIng.eliminar, contratoMutable.ingresoPorParametro, ctrl.eliminar);

module.exports = router;
