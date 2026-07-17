const { Router } = require('express');
const ctrl = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/contactos', ctrl.contactos);
router.get('/no-leidos', ctrl.noLeidos);
router.get('/conversacion/:otroId', ctrl.conversacion);

module.exports = router;
