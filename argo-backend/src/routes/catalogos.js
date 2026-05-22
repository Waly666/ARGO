const { Router } = require('express');
const ctrl = require('../controllers/catalogoController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/divipola/departamentos', ctrl.departamentos);
router.get('/divipola/buscar', ctrl.buscarMunicipios);
router.get('/divipola/municipio/:codMunicipio', ctrl.municipioPorCodigo);
router.get('/divipola/municipios/:codDepto', ctrl.municipios);
router.get('/:nombre', ctrl.listar);

module.exports = router;
