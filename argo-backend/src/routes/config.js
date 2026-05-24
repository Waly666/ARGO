const { Router } = require('express');
const ctrl = require('../controllers/configController');
const certCtrl = require('../controllers/configCertificadoController');
const reqDocCtrl = require('../controllers/configRequisitosDocumentosController');
const nominaCfgCtrl = require('../controllers/configNominaController');
const upload = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/requisitos-documentos', reqDocCtrl.obtener);
router.put('/requisitos-documentos', reqDocCtrl.actualizar);

router.get('/recibo', ctrl.obtenerRecibo);
router.put('/recibo', ctrl.actualizarRecibo);

router.get('/nomina', nominaCfgCtrl.obtener);
router.put('/nomina', nominaCfgCtrl.actualizar);
router.post('/nomina/restaurar', nominaCfgCtrl.restaurar);

router.get('/certificado', certCtrl.obtener);
router.get('/certificado/layout-defaults', certCtrl.layoutDefaults);
router.post('/certificado/vista-previa', certCtrl.vistaPrevia);
router.put('/certificado', certCtrl.actualizar);
router.put(
  '/certificado/firmas',
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
