const { Router } = require('express');
const upload = require('../middleware/upload');
const empleado = require('../controllers/empleadoController');
const cat = require('../controllers/rrhhCatalogoControllers');
const contrato = require('../controllers/contratoController');
const novedad = require('../controllers/novedadNominaController');
const nomina = require('../controllers/nominaController');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

function crud(ctrl) {
  const r = Router();
  r.get('/', ctrl.listar);
  r.get('/:id', ctrl.obtener);
  r.post('/', ctrl.crear);
  r.put('/:id', ctrl.actualizar);
  r.delete('/:id', ctrl.eliminar);
  return r;
}

const empleadoFoto = upload.empleados.fields([{ name: 'foto', maxCount: 1 }]);
router.get('/empleados', empleado.listar);
router.get('/empleados/:id', empleado.obtener);
router.post('/empleados', empleadoFoto, empleado.crear);
router.put('/empleados/:id', empleadoFoto, empleado.actualizar);
router.delete('/empleados/:id', empleado.eliminar);
router.use('/cargos', crud(cat.cargo));
router.use('/departamentos', crud(cat.departamento));
router.use('/eps', crud(cat.eps));
router.use('/afp', crud(cat.afp));
router.use('/arl', crud(cat.arl));
router.use('/cajas-compensacion', crud(cat.cajaCompensacion));
router.use('/contratos', crud(contrato));
router.use('/novedades-nomina', crud(novedad));

router.get('/nomina/config', nomina.config);
router.get('/nomina/periodos', nomina.listarPeriodos);
router.post('/nomina/periodos', nomina.crearPeriodo);
router.get('/nomina/periodos/:id', nomina.obtenerPeriodo);
router.post('/nomina/periodos/:id/generar-novedades', nomina.generarNovedades);
router.post('/nomina/periodos/:id/liquidar', nomina.liquidar);
router.post('/nomina/periodos/:id/reabrir', nomina.reabrirPeriodo);
router.get('/nomina/periodos/:id/liquidacion', nomina.obtenerLiquidacion);
router.post('/nomina/periodos/:id/cerrar', nomina.cerrarPeriodo);
router.post('/nomina/periodos/:id/pagar', nomina.pagarNomina);
router.get('/nomina/periodos/:id/pila.csv', nomina.exportarPila);
router.get('/nomina/periodos/:id/pila.txt', nomina.exportarPilaTxt);
router.get('/nomina/periodos/:id/recibo/:empleadoId', nomina.reciboHtml);

module.exports = router;
