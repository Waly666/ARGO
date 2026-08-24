const { Router } = require('express');
const ctrl = require('../controllers/usuarioController');
const { requireAuth, requirePermiso } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

const ver = requirePermiso('config.usuarios.ver', 'config.usuarios');
const crear = requirePermiso('config.usuarios.crear', 'config.usuarios');
const editar = requirePermiso('config.usuarios.editar', 'config.usuarios');
const eliminar = requirePermiso('config.usuarios.eliminar', 'config.usuarios');

router.get('/roles', ver, ctrl.roles);
router.get('/', ver, ctrl.listar);
router.get('/:id', ver, ctrl.obtener);
router.post('/', crear, ctrl.crear);
router.put('/:id', editar, ctrl.actualizar);
router.post('/:id/reset-mfa', editar, ctrl.resetearMfa);
router.delete('/:id/permanente', eliminar, ctrl.borrar);
router.delete('/:id', eliminar, ctrl.eliminar);

module.exports = router;
