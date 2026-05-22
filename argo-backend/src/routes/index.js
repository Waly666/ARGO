const { Router } = require('express');

const auth = require('./auth');
const catalogos = require('./catalogos');
const alumnos = require('./alumnos');
const matriculas = require('./matriculas');
const liquidacion = require('./liquidacion');
const ingresos = require('./ingresos');
const certificados = require('./certificados');
const config = require('./config');

const router = Router();

router.use('/auth', auth);
router.use('/catalogos', catalogos);
router.use('/alumnos', alumnos);
router.use('/matriculas', matriculas);
router.use('/liquidacion', liquidacion);
router.use('/ingresos', ingresos);
router.use('/certificados', certificados);
router.use('/config', config);

module.exports = router;
