const { Router } = require('express');
const cfgCtrl = require('../controllers/configPasarelaController');
const consignacionCfgCtrl = require('../controllers/configPagoConsignacionController');
const consignacionCtrl = require('../controllers/pagoConsignacionController');
const infCtrl = require('../controllers/informesVirtualesController');
const { requireAuth, requirePermiso } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();

const configPerm = requirePermiso('config.recibos', 'aula_virtual.gestionar', 'config.facturacion');
const consignacionAdminPerm = requirePermiso('caja.admin');
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

router.get('/consignacion/config', requireAuth, configPerm, consignacionCfgCtrl.obtener);
router.put('/consignacion/config', requireAuth, configPerm, consignacionCfgCtrl.actualizar);
router.get('/consignacion/config/publico', consignacionCfgCtrl.estadoPublico);
router.post(
  '/consignacion/medios/:medioId/qr',
  requireAuth,
  configPerm,
  upload.pagoConsignacionQr.single('qr'),
  consignacionCfgCtrl.subirQrMedio,
);

router.get('/consignacion/solicitudes', requireAuth, consignacionAdminPerm, consignacionCtrl.listar);
router.post('/consignacion/solicitudes/:id/aprobar', requireAuth, consignacionAdminPerm, consignacionCtrl.aprobar);
router.post('/consignacion/solicitudes/:id/rechazar', requireAuth, consignacionAdminPerm, consignacionCtrl.rechazar);

router.get('/informes/matriculas', requireAuth, informesPerm, infCtrl.matriculasVirtuales);
router.get('/informes/ingresos', requireAuth, ingresosEnLineaPerm, infCtrl.ingresosEnLinea);
router.get('/informes/matriculas/export', requireAuth, informesPerm, infCtrl.exportarMatriculas);
router.get('/informes/ingresos/export', requireAuth, ingresosEnLineaPerm, infCtrl.exportarIngresos);

module.exports = router;
