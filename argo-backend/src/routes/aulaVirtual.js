const { Router } = require('express');
const ctrl = require('../controllers/aulaVirtualController');
const admin = require('../controllers/aulaVirtualAdminController');
const { requireAuth, requirePermiso } = require('../middleware/auth');
const { requirePortalAuth } = require('../middleware/authPortal');
const {
  aulaVirtualZip,
  aulaVirtualMateriales,
  aulaVirtualLogo,
  programasVirtual,
} = require('../middleware/upload');

const router = Router();

/** Público — portal estudiante */
router.get('/config', ctrl.configPublica);
router.get('/categorias', ctrl.listarCategorias);
router.get('/cursos', ctrl.listarCursos);
router.get('/cursos/:id', ctrl.obtenerCurso);
router.get('/auth/buscar-alumno', ctrl.buscarAlumnoRegistro);
router.post('/auth/registro', ctrl.registro);
router.post('/auth/login', ctrl.login);
router.get('/auth/perfil', requirePortalAuth, ctrl.miPerfil);
router.get('/argo-bridge.js', ctrl.bridgeScript);

router.get('/mis-cursos', requirePortalAuth, ctrl.misCursos);
router.get('/mis-certificados', requirePortalAuth, ctrl.misCertificados);
router.get('/certificados/:id/html', requirePortalAuth, ctrl.certificadoHtml);
router.get('/recibos/:id/html', requirePortalAuth, ctrl.reciboHtml);
router.get('/cursos/:id/progreso', requirePortalAuth, ctrl.obtenerProgreso);
router.post('/cursos/:id/progreso', requirePortalAuth, ctrl.reportarProgreso);
router.get('/cursos/:id/inscripcion', requirePortalAuth, ctrl.estadoInscripcion);
router.post('/cursos/:id/matricular', requirePortalAuth, ctrl.matricularCurso);

/** Admin — app ARGO (staff) */
const gestionar = requirePermiso('programas.gestionar');

router.get('/admin/usuarios', requireAuth, gestionar, admin.listarUsuariosPortal);
router.get('/admin/categorias', requireAuth, gestionar, admin.listarCategoriasAdmin);
router.post('/admin/categorias', requireAuth, gestionar, admin.crearCategoria);
router.put('/admin/categorias/:id', requireAuth, gestionar, admin.actualizarCategoria);
router.delete('/admin/categorias/:id', requireAuth, gestionar, admin.eliminarCategoria);

router.get('/admin/cursos', requireAuth, gestionar, admin.listarCursosAdmin);
router.get('/admin/cursos/:id', requireAuth, gestionar, admin.obtenerCursoAdmin);
router.put('/admin/cursos/:id', requireAuth, gestionar, admin.guardarConfigCurso);
router.post(
  '/admin/cursos/:id/paquete',
  requireAuth,
  gestionar,
  aulaVirtualZip.single('paquete'),
  admin.subirPaqueteZip,
);
router.post(
  '/admin/cursos/:id/portada',
  requireAuth,
  gestionar,
  programasVirtual.single('portada'),
  admin.subirPortadaCurso,
);
router.delete('/admin/cursos/:id/portada', requireAuth, gestionar, admin.quitarPortadaCurso);
router.post(
  '/admin/cursos/:id/materiales',
  requireAuth,
  gestionar,
  aulaVirtualMateriales.single('archivo'),
  admin.subirMaterial,
);
router.delete('/admin/cursos/:id/materiales/:materialId', requireAuth, gestionar, admin.eliminarMaterial);
router.post('/admin/cursos/:id/matricular', requireAuth, gestionar, admin.matricularAlumnoCurso);
router.post('/admin/cursos/:id/reintegrar-bridge', requireAuth, gestionar, admin.reintegrarBridge);

router.get('/admin/portal', requireAuth, gestionar, admin.obtenerConfigPortal);
router.put('/admin/portal', requireAuth, gestionar, admin.guardarConfigPortal);
router.post(
  '/admin/portal/logo',
  requireAuth,
  gestionar,
  aulaVirtualLogo.single('logo'),
  admin.subirLogoPortal,
);
router.delete('/admin/portal/logo', requireAuth, gestionar, admin.quitarLogoPortal);

module.exports = router;
