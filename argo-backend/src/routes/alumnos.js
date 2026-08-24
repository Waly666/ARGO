const { Router } = require('express');
const ctrl = require('../controllers/alumnoController');
const { requireAuth, requirePermiso } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth);

const acc = accionesModulo('alumnos');
const pagosVer = requirePermiso('alumnos.pagos');

const files = upload.alumnos.fields([
  { name: 'foto', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'licencia', maxCount: 1 },
]);

router.get('/', acc.ver, ctrl.listar);
router.get('/alertas-comprobantes-recientes', acc.ver, ctrl.comprobantesRecientes);
router.get('/alertas-pago-hoy', acc.ver, ctrl.alertasPagoHoy);
router.get('/verificar-doc/:numDoc', acc.ver, ctrl.verificarDocumento);
router.get('/doc/:numDoc', acc.ver, ctrl.porDocumento);
router.post('/escanear-cedula', acc.crear, upload.memory.single('imagen'), ctrl.escanearCedula);
router.post('/escanear-cedula-mrz', acc.crear, upload.memory.single('imagen'), ctrl.escanearCedulaMrz);
router.get('/:id/documentos-requeridos', acc.ver, ctrl.documentosRequeridos);
router.get('/:id/indicadores-hoy', acc.ver, ctrl.indicadoresHoy);
router.get('/:id/documentos-validacion', acc.ver, ctrl.validarDocumentos);
router.get('/:id/portal', acc.ver, ctrl.estadoPortal);
router.put('/:id/documentos/:idDoc', acc.editar, upload.alumnos.single('archivo'), ctrl.subirDocumento);
router.get('/:id', acc.ver, ctrl.porId);
router.post('/', acc.crear, files, ctrl.crear);
router.put('/:id', acc.editar, files, ctrl.actualizar);
router.post(
  '/:id/portal/enviar-acceso',
  requirePermiso('alumnos.gestionar', 'alumnos.editar', 'aula_virtual.gestionar'),
  ctrl.enviarAccesoPortal,
);
router.put(
  '/:id/portal/password',
  requirePermiso('alumnos.gestionar', 'alumnos.editar', 'aula_virtual.gestionar'),
  ctrl.resetearPasswordPortal,
);
router.delete('/:id', acc.eliminar, ctrl.eliminar);

module.exports = router;
