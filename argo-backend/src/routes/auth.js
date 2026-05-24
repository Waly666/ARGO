const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/login', ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.post('/verificar-admin', requireAuth, ctrl.verificarAdmin);

module.exports = router;
