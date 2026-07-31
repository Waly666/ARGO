const { Router } = require('express');
const cfgCtrl = require('../controllers/configPasarelaController');
const infCtrl = require('../controllers/informesVirtualesController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();

const configPerm = requirePermiso('config.recibos', 'aula_virtual.gestionar', 'config.facturacion');
const informesPerm = requirePermiso(
  'aula_virtual.informes',
  'aula_virtual.gestionar',
  'informes.ver',
  'alumnos.ver',
  'caja.turno',
  'caja.admin',
  'contabilidad',
);
/** Informe de cobros pasarela: solo admin (caja.admin) y contabilidad/contador. */
const ingresosEnLineaPerm = requirePermiso('caja.admin', 'contabilidad');

router.get('/config', requireAuth, configPerm, cfgCtrl.obtener);
router.put('/config', requireAuth, configPerm, cfgCtrl.actualizar);
router.get('/config/publico', cfgCtrl.estadoPublico);

router.get('/informes/matriculas', requireAuth, informesPerm, infCtrl.matriculasVirtuales);
router.get('/informes/ingresos', requireAuth, ingresosEnLineaPerm, infCtrl.ingresosEnLinea);
router.get('/informes/matriculas/export', requireAuth, informesPerm, infCtrl.exportarMatriculas);
router.get('/informes/ingresos/export', requireAuth, ingresosEnLineaPerm, infCtrl.exportarIngresos);

module.exports = router;
