const { Router } = require('express');
const ctrl = require('../controllers/configController');
const georefCtrl = require('../controllers/configGeorefController');
const facturacionCtrl = require('../controllers/configFacturacionController');
const certCtrl = require('../controllers/configCertificadoController');
const reqDocCtrl = require('../controllers/configRequisitosDocumentosController');
const reqDocVehiCtrl = require('../controllers/configRequisitosDocumentosVehiculosController');
const reqDocEmpCtrl = require('../controllers/configRequisitosDocumentosEmpleadosController');
const fmtInspVehiCtrl = require('../controllers/configFormatoInspeccionVehiculosController');
const nominaCfgCtrl = require('../controllers/configNominaController');
const upload = require('../middleware/upload');
const { requireAuth, requirePermiso, loadSedeActiva } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/requisitos-documentos', requirePermiso('config.requisitos'), reqDocCtrl.obtener);
router.put('/requisitos-documentos', requirePermiso('config.requisitos'), reqDocCtrl.actualizar);

router.get('/requisitos-documentos-vehiculos', requirePermiso('config.requisitos'), reqDocVehiCtrl.obtener);
router.put('/requisitos-documentos-vehiculos', requirePermiso('config.requisitos'), reqDocVehiCtrl.actualizar);

router.get('/requisitos-documentos-empleados', requirePermiso('config.requisitos'), reqDocEmpCtrl.obtener);
router.put('/requisitos-documentos-empleados', requirePermiso('config.requisitos'), reqDocEmpCtrl.actualizar);

router.get('/formato-inspeccion-vehiculos', requirePermiso('config.requisitos'), fmtInspVehiCtrl.obtener);
router.put('/formato-inspeccion-vehiculos', requirePermiso('config.requisitos'), fmtInspVehiCtrl.actualizar);

router.get('/georef/mapa', requireAuth, georefCtrl.obtenerMapa);
router.get('/georef/proveedores', requirePermiso('config.georef'), georefCtrl.catalogoProveedores);
router.get('/georef', requirePermiso('config.georef'), georefCtrl.obtener);
router.put('/georef', requirePermiso('config.georef'), georefCtrl.actualizar);
router.post('/georef/probar', requirePermiso('config.georef'), georefCtrl.probar);

router.get('/facturacion', requirePermiso('config.facturacion', 'facturacion'), facturacionCtrl.obtener);
router.put('/facturacion', requirePermiso('config.facturacion'), facturacionCtrl.actualizar);
router.post('/facturacion/probar', requirePermiso('config.facturacion', 'facturacion'), facturacionCtrl.probar);
router.get('/facturacion/rangos', requirePermiso('config.facturacion', 'facturacion'), facturacionCtrl.rangos);

router.get('/recibo/encabezado', requireAuth, loadSedeActiva, ctrl.obtenerReciboEncabezado);
router.get('/recibo', requirePermiso('config.recibos'), ctrl.obtenerRecibo);
router.put('/recibo', requirePermiso('config.recibos'), ctrl.actualizarRecibo);

router.get('/nomina', requirePermiso('config.nomina'), nominaCfgCtrl.obtener);
router.put('/nomina', requirePermiso('config.nomina'), nominaCfgCtrl.actualizar);
router.post('/nomina/restaurar', requirePermiso('config.nomina'), nominaCfgCtrl.restaurar);

router.get('/certificado', requirePermiso('config.certificados'), certCtrl.obtener);
router.get('/certificado/layout-defaults', requirePermiso('config.certificados'), certCtrl.layoutDefaults);
router.post('/certificado/vista-previa', requirePermiso('config.certificados'), certCtrl.vistaPrevia);
router.put('/certificado', requirePermiso('config.certificados'), certCtrl.actualizar);
router.put(
  '/certificado/firmas',
  requirePermiso('config.certificados'),
  upload.certificados.fields([
    { name: 'firmaDirector', maxCount: 1 },
    { name: 'firmaInstructor', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const dto = { ...(req.body || {}) };
      if (req.files?.firmaDirector?.[0]) {
        dto.urlFirmaDirector = upload.publicUrl('certificados', req.files.firmaDirector[0].filename);
      }
      if (req.files?.firmaInstructor?.[0]) {
        dto.urlFirmaInstructor = upload.publicUrl('certificados', req.files.firmaInstructor[0].filename);
      }
      req.body = dto;
      return certCtrl.actualizar(req, res, next);
    } catch (e) {
      next(e);
    }
  },
);

module.exports = router;
