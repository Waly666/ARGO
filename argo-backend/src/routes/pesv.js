const { Router } = require('express');
const ctrl = require('../controllers/pesvController');
const { requireAuth } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth);

const acc = accionesModulo('pesv');

router.get('/config', acc.ver, ctrl.getConfig);
router.put('/config', acc.editar, ctrl.putConfig);
router.get('/config/pdf', acc.ver, ctrl.getConfigPdf);
router.put('/config/pdf', acc.editar, ctrl.putConfigPdf);
router.post(
  '/config/pdf/imagen/:zona',
  acc.editar,
  upload.pesvPdfLayout.single('archivo'),
  ctrl.postConfigPdfImagen,
);
router.post(
  '/config/pdf/documento/:itemNo/portada',
  acc.editar,
  upload.pesvPdfPortada.single('archivo'),
  ctrl.postConfigPdfPortadaDocumento,
);

router.get('/catalogo/fase1', acc.ver, ctrl.getCatalogoFase1);
router.get('/catalogo/fase2', acc.ver, ctrl.getCatalogoFase2);

router.get('/autodiagnostico', acc.ver, ctrl.getAutodiagnostico);
router.put('/autodiagnostico', acc.editar, ctrl.putAutodiagnostico);

router.get('/captura/indice', acc.ver, ctrl.getCapturaIndice);
router.get('/captura', acc.ver, ctrl.getCaptura);
router.put('/captura', acc.editar, ctrl.putCaptura);

router.get('/fase1', acc.ver, ctrl.getFase1);
router.put('/fase1', acc.editar, ctrl.putFase1);
router.post('/fase1/:vigencia/items/:itemNo/generar', acc.editar, ctrl.postFase1Generar);
router.post(
  '/fase1/:vigencia/items/:itemNo/adjunto',
  acc.editar,
  upload.pesvFase1.single('archivo'),
  ctrl.postFase1Adjunto,
);

router.get('/fase2', acc.ver, ctrl.getFase2);
router.put('/fase2', acc.editar, ctrl.putFase2);
router.post(
  '/fase2/:vigencia/:mes/adjunto/:tab/:evidenciaId',
  acc.editar,
  upload.pesvFase2.single('archivo'),
  ctrl.postFase2Adjunto,
);

router.get('/flota/sugerencias', acc.ver, ctrl.getSugerenciasFlota);
router.get('/tablero', acc.ver, ctrl.getTablero);

router.get('/resumen', acc.ver, ctrl.getResumen);

module.exports = router;
