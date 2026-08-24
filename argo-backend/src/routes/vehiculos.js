const { Router } = require('express');
const ctrl = require('../controllers/vehiculoController');
const inspCtrl = require('../controllers/inspeccionVehiculoController');
const { requireAuth, loadSedeActiva, exigirSedeActiva, requirePermiso } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const upload = require('../middleware/upload');

const router = Router();
router.use(requireAuth, loadSedeActiva, exigirSedeActiva);

router.get('/alertas-documentos', ctrl.alertasDocumentos);
router.get('/alertas-documentos-faltantes', ctrl.alertasDocumentosFaltantes);
router.get('/alertas-inspeccion-pendiente', inspCtrl.alertasInspeccionPendiente);

const accVeh = accionesModulo('vehiculos');
const permisoInspeccion = requirePermiso('vehiculos', 'instructores.inspeccion');

router.get('/meta', accVeh.ver, ctrl.meta);
router.get('/marcas', accVeh.ver, ctrl.listarMarcas);
router.get('/lineas', accVeh.ver, ctrl.listarLineas);
router.get('/colores', accVeh.ver, ctrl.listarColores);
router.get('/clases', accVeh.ver, ctrl.listarClases);
router.get('/tipos-documento', accVeh.ver, ctrl.listarTiposDocumento);
router.get('/verificar-placa/:placa', accVeh.ver, ctrl.verificarPlaca);

router.get('/', accVeh.ver, ctrl.listar);
router.get('/:id/inspeccion', permisoInspeccion, inspCtrl.listar);
router.get('/:id/inspeccion/hoy', permisoInspeccion, inspCtrl.obtenerDelDia);
router.put('/:id/inspeccion', permisoInspeccion, inspCtrl.guardar);
router.get('/:id/inspeccion/imprimir', permisoInspeccion, inspCtrl.imprimir);

router.get('/:id/documentos-requeridos', accVeh.ver, ctrl.documentosRequeridos);
router.get('/:id/documentos-validacion', accVeh.ver, ctrl.documentosValidacion);
router.get('/:id/documentos', accVeh.ver, ctrl.listarDocumentos);
router.post('/:id/documentos', accVeh.editar, upload.vehiculos.single('archivo'), ctrl.crearDocumento);
router.put(
  '/:id/documentos/:docId',
  accVeh.editar,
  upload.vehiculos.single('archivo'),
  ctrl.actualizarDocumento,
);
router.delete('/:id/documentos/:docId', accVeh.eliminar, ctrl.eliminarDocumento);

// Detalle: flota (vehiculos) o inspección desde portal instructor.
router.get('/:id', permisoInspeccion, ctrl.porId);
router.post('/', accVeh.crear, upload.vehiculos.single('foto'), ctrl.crear);
router.put('/:id', accVeh.editar, upload.vehiculos.single('foto'), ctrl.actualizar);
router.delete('/:id', accVeh.eliminar, ctrl.eliminar);

module.exports = router;
