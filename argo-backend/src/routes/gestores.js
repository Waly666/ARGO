const { Router } = require('express');
const ctrl = require('../controllers/gestorController');
const { requireAuth, requirePermiso } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth);

/** Lectura del catálogo: cualquier usuario autenticado (cajero, alumnos, matrícula). */
const gestionar = requirePermiso('caja.admin', 'contabilidad');
const gestorFoto = upload.gestores.fields([{ name: 'foto', maxCount: 1 }]);

router.get('/catalogos', ctrl.catalogos);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.obtener);
router.post('/', gestionar, gestorFoto, ctrl.crear);
router.put('/:id', gestionar, gestorFoto, ctrl.actualizar);
router.delete('/:id', gestionar, ctrl.eliminar);

module.exports = router;
