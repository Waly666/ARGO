const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { staffLoginLimiter } = require('../middleware/security');
const { requireTurnstile } = require('../middleware/turnstile');

const router = Router();

router.get('/config', ctrl.configPublica);
router.post('/login', staffLoginLimiter, requireTurnstile({ allowNativeClients: true }), ctrl.login);
router.get('/me', requireAuth, ctrl.me);
router.post('/verificar-admin', requireAuth, ctrl.verificarAdmin);

module.exports = router;
