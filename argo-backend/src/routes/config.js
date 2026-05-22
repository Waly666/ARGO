const { Router } = require('express');
const ctrl = require('../controllers/configController');
const certCtrl = require('../controllers/configCertificadoController');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/recibo', ctrl.obtenerRecibo);
router.put('/recibo', ctrl.actualizarRecibo);

router.get('/certificado', certCtrl.obtener);
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
