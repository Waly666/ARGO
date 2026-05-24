const { Router } = require('express');
const ctrl = require('../controllers/alumnoController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth);

const files = upload.alumnos.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'licencia', maxCount: 1 },
]);

router.get('/', ctrl.listar);
router.get('/verificar-doc/:numDoc', ctrl.verificarDocumento);
router.get('/doc/:numDoc', ctrl.porDocumento);
router.post('/escanear-cedula', upload.memory.single('imagen'), ctrl.escanearCedula);
router.get('/:id/documentos-requeridos', ctrl.documentosRequeridos);
router.get('/:id/documentos-validacion', ctrl.validarDocumentos);
router.put('/:id/documentos/:idDoc', upload.alumnos.single('archivo'), ctrl.subirDocumento);
router.get('/:id', ctrl.porId);
router.post('/', files, ctrl.crear);
router.put('/:id', files, ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
