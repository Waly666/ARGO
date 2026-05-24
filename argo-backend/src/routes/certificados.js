const { Router } = require('express');
const ctrl = require('../controllers/certificadoController');
const render = require('../controllers/certificadoRenderController');
const plantilla = require('../controllers/plantillaCertificadoController');
const upload = require('../middleware/upload');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/tipos', ctrl.tiposCertificado);
router.get('/plantillas', plantilla.listar);
router.get('/plantillas/todas', plantilla.listarTodas);
router.post('/plantillas', upload.certificados.single('fondo'), plantilla.crear);
router.put('/plantillas/:id', upload.certificados.single('fondo'), plantilla.actualizar);
router.delete('/plantillas/:id', plantilla.eliminar);

router.get('/elegibles/:numDoc', ctrl.elegibles);
router.get('/alumno/:numDoc', ctrl.listarPorAlumno);
router.get('/:id/html', render.html);
router.get('/:id/datos', render.datos);
router.post('/', ctrl.crear);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.eliminar);

module.exports = router;
