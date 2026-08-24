const { Router } = require('express');
const ctrl = require('../controllers/certificadoController');
const render = require('../controllers/certificadoRenderController');
const plantilla = require('../controllers/plantillaCertificadoController');
const upload = require('../middleware/upload');
const { requireAuth, requirePermiso, requireAdmin } = require('../middleware/auth');
const { accionesModulo } = require('../middleware/gateAccion');
const { actualizarCertificadosVencidos } = require('../services/certificadoVencimientoCron');
const contratoMutable = require('../middleware/contratoJornadaMutable');

const router = Router();
router.use(requireAuth);

const acc = accionesModulo('certificados');
const verVencidos = requirePermiso('certificados.vencidos', 'alumnos.certificados');
const verCertAlertas = requirePermiso('alumnos.certificados', 'jornadas.ver', 'jornadas.gestionar');
const config = requirePermiso('config.certificados');

router.get('/tipos', acc.ver, ctrl.tiposCertificado);
router.get('/plantillas', acc.ver, plantilla.listar);
router.get('/plantillas/todas', config, plantilla.listarTodas);
router.post('/plantillas', config, upload.certificados.single('fondo'), plantilla.crear);
router.put('/plantillas/:id', config, upload.certificados.single('fondo'), plantilla.actualizar);
router.delete('/plantillas/:id', config, plantilla.eliminar);

router.post('/admin/marcar-vencidos', requireAdmin, async (req, res, next) => {
  try {
    const result = await actualizarCertificadosVencidos();
    res.json({
      ok: true,
      actualizados: result.actualizados,
      message: result.actualizados > 0
        ? `${result.actualizados} certificado(s) marcado(s) como vencido.`
        : 'No había certificados nuevos por marcar como vencidos.',
      ...(result.error ? { error: result.error } : {}),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/recientes', verCertAlertas, ctrl.recientes);
router.get('/listado', acc.ver, ctrl.listarGlobal);
router.get('/vencidos/exportar', verVencidos, ctrl.exportarVencidos);
router.get('/vencidos', verVencidos, ctrl.listarVencidos);
router.get('/alertas-vencimiento', verCertAlertas, ctrl.alertasPorVencer);
router.get('/alertas-por-vencer', verCertAlertas, ctrl.alertasPorVencer);
router.get('/alertas-vencidos', verCertAlertas, ctrl.alertasVencidos);
router.get('/elegibles/:numDoc', acc.ver, ctrl.elegibles);
router.get('/alumno/:numDoc', acc.ver, ctrl.listarPorAlumno);
router.get('/:id/html', acc.ver, render.html);
router.get('/:id/datos', acc.ver, render.datos);
router.post('/', acc.crear, contratoMutable.contratoPorBodyOpcional, ctrl.crear);
router.put('/:id', acc.editar, contratoMutable.certificadoPorParametro, ctrl.actualizar);
router.delete('/:id', acc.eliminar, contratoMutable.certificadoPorParametro, ctrl.eliminar);

module.exports = router;
