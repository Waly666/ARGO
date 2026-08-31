const { Router } = require('express');
const ctrl = require('../controllers/aulaVirtualController');
const admin = require('../controllers/aulaVirtualAdminController');
const { requireAuth, requirePermiso, requireAdmin } = require('../middleware/auth');
const { requirePortalAuth } = require('../middleware/authPortal');
const {
  aulaVirtualZip,
  aulaVirtualMateriales,
  aulaVirtualLogo,
  aulaVirtualHero,
  aulaVirtualFundacionHero,
  aulaVirtualAcercaHero,
  aulaVirtualGaleriaHero,
  aulaVirtualCursosConduccionHero,
  aulaVirtualPopup,
  aulaVirtualConsultaAsistente,
  aulaVirtualCursosConduccion,
  aulaVirtualExamenTeorico,
  aulaVirtualMercanciasPeligrosas,
  aulaVirtualTrabajoEnAlturas,
  aulaVirtualBlog,
  aulaVirtualGaleria,
  aulaVirtualHomeFotos,
  aulaVirtualHomePublicidad,
  aulaVirtualCursosConduccionPublicidad,
  aulaVirtualApk,
  programasVirtual,
  pagoConsignacionComprobante,
} = require('../middleware/upload');
const { portalAuthLimiter, buscarAlumnoLimiter } = require('../middleware/security');
const { requireTurnstile } = require('../middleware/turnstile');
const { requireConsultaDescargaToken } = require('../middleware/certificadoConsultaDescarga');

/** Turnstile activo en web; apps móviles envían X-ARGO-Cliente: mobile */
const turnstilePortal = requireTurnstile({ allowNativeClients: true });

const router = Router();

/** Público — portal estudiante */
router.get('/sitemap.xml', ctrl.sitemapXml);
router.get('/config', ctrl.configPublica);
router.get('/legal/autorizacion-datos', ctrl.autorizacionDatosLegal);
router.get('/catalogos/tipos-doc', ctrl.catalogosTiposDoc);
router.get('/catalogos/generos', ctrl.catalogosGeneros);
router.get('/catalogos/departamentos', ctrl.catalogosDepartamentos);
router.get('/catalogos/municipios-buscar', ctrl.catalogosBuscarMunicipios);
router.get('/catalogos/municipio/:codMunicipio', ctrl.catalogosMunicipio);
router.get('/catalogos/municipios/:codDepto', ctrl.catalogosMunicipios);
router.get('/categorias', ctrl.listarCategorias);
router.get('/blog', ctrl.listarBlog);
router.get('/blog/:slug', ctrl.obtenerBlogPost);
router.get('/cursos', ctrl.listarCursos);
router.get('/cursos/:id', ctrl.obtenerCurso);
router.get(
  '/auth/buscar-alumno',
  buscarAlumnoLimiter,
  turnstilePortal,
  ctrl.buscarAlumnoRegistro,
);
router.get(
  '/certificados/consulta',
  buscarAlumnoLimiter,
  turnstilePortal,
  ctrl.consultarCertificados,
);
router.get(
  '/certificados/consulta/:id/pdf',
  buscarAlumnoLimiter,
  requireConsultaDescargaToken,
  ctrl.certificadoConsultaPdf,
);
router.get(
  '/encuestas-jornada/pendientes',
  buscarAlumnoLimiter,
  turnstilePortal,
  ctrl.encuestasJornadaPendientes,
);
router.get(
  '/encuestas-jornada/:id',
  buscarAlumnoLimiter,
  ctrl.encuestaJornadaDetalle,
);
router.post(
  '/encuestas-jornada/:id/responder',
  buscarAlumnoLimiter,
  turnstilePortal,
  ctrl.encuestaJornadaResponder,
);
router.post('/auth/registro', portalAuthLimiter, turnstilePortal, ctrl.registro);
router.post('/auth/registro/solicitar', portalAuthLimiter, turnstilePortal, ctrl.registroSolicitar);
router.post('/auth/registro/confirmar', portalAuthLimiter, ctrl.registroConfirmar);
router.post('/auth/registro/reenviar-codigo', portalAuthLimiter, ctrl.registroReenviarCodigo);
router.post('/auth/registro-jornada/solicitar', portalAuthLimiter, turnstilePortal, ctrl.registroJornadaSolicitar);
router.post('/auth/registro-jornada/confirmar', portalAuthLimiter, ctrl.registroJornadaConfirmar);
router.post('/auth/registro-jornada/reenviar-codigo', portalAuthLimiter, ctrl.registroJornadaReenviarCodigo);
router.post('/auth/login', portalAuthLimiter, turnstilePortal, ctrl.login);
router.post('/contacto', buscarAlumnoLimiter, turnstilePortal, ctrl.enviarContacto);
router.post('/pqr', buscarAlumnoLimiter, turnstilePortal, ctrl.enviarPqr);
router.get('/auth/perfil', requirePortalAuth, ctrl.miPerfil);
router.post('/auth/cambiar-password', requirePortalAuth, portalAuthLimiter, ctrl.cambiarPassword);
router.patch('/auth/empresa', requirePortalAuth, ctrl.actualizarEmpresa);
router.get('/empresas/buscar', requirePortalAuth, ctrl.buscarEmpresasPortal);
router.get('/empresas/buscar-publico', buscarAlumnoLimiter, ctrl.buscarEmpresasPortal);
router.get('/argo-bridge.js', ctrl.bridgeScript);

router.get('/mis-cursos', requirePortalAuth, ctrl.misCursos);
router.get('/mis-clases-presenciales', requirePortalAuth, ctrl.misClasesPresenciales);
router.get('/mis-clases-presenciales/:idCohorte/calendario', requirePortalAuth, ctrl.calendarioCohorte);
router.post('/clases-cohorte/:idClase/asistir-meet', requirePortalAuth, ctrl.asistirClaseMeet);
router.get('/mis-clases-presenciales/:idCohorte/evaluaciones', requirePortalAuth, ctrl.evaluacionesCohorteAlumno);
router.get('/mis-clases-presenciales/:idCohorte/materiales', requirePortalAuth, ctrl.materialesCohorteAlumno);
router.post('/evaluaciones-cohorte/:idEval/iniciar', requirePortalAuth, ctrl.iniciarIntentoEvaluacion);
router.post('/evaluaciones-cohorte/:idEval/enviar', requirePortalAuth, ctrl.enviarIntentoEvaluacion);
router.get('/mis-certificados', requirePortalAuth, ctrl.misCertificados);
router.get('/certificados/:id/html', requirePortalAuth, ctrl.certificadoHtml);
router.get('/recibos/:id/html', requirePortalAuth, ctrl.reciboHtml);
router.get('/cursos/:id/progreso', requirePortalAuth, ctrl.obtenerProgreso);
router.post('/cursos/:id/progreso', requirePortalAuth, ctrl.reportarProgreso);
router.get('/cursos/:id/inscripcion', requirePortalAuth, ctrl.estadoInscripcion);
router.post('/cursos/:id/matricular', requirePortalAuth, ctrl.matricularCurso);
router.post('/cursos/:id/pagar-linea', requirePortalAuth, ctrl.iniciarPagoEnLinea);
router.get('/cursos/:id/consignacion', requirePortalAuth, ctrl.estadoConsignacionCurso);
router.post(
  '/cursos/:id/consignacion',
  requirePortalAuth,
  pagoConsignacionComprobante.single('comprobante'),
  ctrl.crearSolicitudConsignacionCurso,
);

/** Admin — app ARGO (staff): solo permisos explícitos de aula virtual */
const ver = requirePermiso('aula_virtual.ver', 'aula_virtual.gestionar');
const gestionar = requirePermiso('aula_virtual.gestionar');
const configPortal = requirePermiso('aula_virtual.sitio', 'aula_virtual.gestionar');

router.get('/admin/alertas-eventos', requireAuth, ver, admin.listarAlertasEventosPortal);
router.get('/admin/alertas-acceso-por-vencer', requireAuth, ver, admin.listarAlertasAccesoPorVencer);
router.get('/admin/usuarios', requireAuth, ver, admin.listarUsuariosPortal);
router.post('/admin/usuarios', requireAuth, gestionar, admin.crearUsuarioPortal);
router.delete('/admin/usuarios/:id', requireAuth, gestionar, admin.eliminarUsuarioPortal);
router.get('/admin/categorias', requireAuth, ver, admin.listarCategoriasAdmin);
router.post('/admin/categorias', requireAuth, gestionar, admin.crearCategoria);
router.put('/admin/categorias/:id', requireAuth, gestionar, admin.actualizarCategoria);
router.delete('/admin/categorias/:id', requireAuth, gestionar, admin.eliminarCategoria);

router.get('/admin/cursos', requireAuth, ver, admin.listarCursosAdmin);
router.get('/admin/cursos/:id', requireAuth, ver, admin.obtenerCursoAdmin);
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
router.get('/admin/cursos/:id/progreso-alumnos', requireAuth, ver, admin.listarProgresoAlumnos);
router.get('/admin/alumnos/:numDoc/progreso-cursos', requireAuth, ver, admin.listarProgresoAlumno);
router.post(
  '/admin/alumnos/:numDoc/cursos/:idPrograma/reiniciar-progreso',
  requireAuth,
  gestionar,
  admin.reiniciarProgresoAlumnoCurso,
);
router.post(
  '/admin/alumnos/:numDoc/cursos/:idPrograma/anular-matricula',
  requireAuth,
  gestionar,
  admin.anularMatriculaAlumnoCurso,
);
router.post('/admin/cursos/:id/reintegrar-bridge', requireAuth, gestionar, admin.reintegrarBridge);

router.get('/admin/portal', requireAuth, configPortal, admin.obtenerConfigPortal);
router.put('/admin/portal', requireAuth, configPortal, admin.guardarConfigPortal);
router.post(
  '/admin/portal/logo',
  requireAuth,
  configPortal,
  aulaVirtualLogo.single('logo'),
  admin.subirLogoPortal,
);
router.delete('/admin/portal/logo', requireAuth, configPortal, admin.quitarLogoPortal);
router.post(
  '/admin/portal/hero-imagen',
  requireAuth,
  configPortal,
  aulaVirtualHero.single('imagen'),
  admin.subirImagenHeroPortal,
);
router.delete('/admin/portal/hero-imagen', requireAuth, configPortal, admin.quitarImagenHeroPortal);
router.post(
  '/admin/portal/fundacion-hero-imagen',
  requireAuth,
  configPortal,
  aulaVirtualFundacionHero.single('imagen'),
  admin.subirImagenFundacionPortal,
);
router.delete(
  '/admin/portal/fundacion-hero-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenFundacionPortal,
);
router.post(
  '/admin/portal/acerca-hero-imagen',
  requireAuth,
  configPortal,
  aulaVirtualAcercaHero.single('imagen'),
  admin.subirImagenAcercaPortal,
);
router.delete(
  '/admin/portal/acerca-hero-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenAcercaPortal,
);
router.post(
  '/admin/portal/galeria-hero-imagen',
  requireAuth,
  configPortal,
  aulaVirtualGaleriaHero.single('imagen'),
  admin.subirImagenGaleriaHeroPortal,
);
router.delete(
  '/admin/portal/galeria-hero-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenGaleriaHeroPortal,
);
router.post(
  '/admin/portal/cursos-conduccion-hero-imagen',
  requireAuth,
  configPortal,
  aulaVirtualCursosConduccionHero.single('imagen'),
  admin.subirImagenCursosConduccionPortal,
);
router.delete(
  '/admin/portal/cursos-conduccion-hero-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenCursosConduccionPortal,
);
router.post(
  '/admin/portal/popup-imagen',
  requireAuth,
  configPortal,
  aulaVirtualPopup.single('imagen'),
  admin.subirImagenPopupPortal,
);
router.delete('/admin/portal/popup-imagen', requireAuth, configPortal, admin.quitarImagenPopupPortal);
router.post(
  '/admin/portal/app-mobile-apk',
  requireAuth,
  configPortal,
  aulaVirtualApk.single('apk'),
  admin.subirApkPortal,
);
router.post(
  '/admin/portal/consulta-certificados-asistente-video',
  requireAuth,
  configPortal,
  aulaVirtualConsultaAsistente.single('video'),
  admin.subirVideoAsistenteCertificadosPortal,
);
router.delete(
  '/admin/portal/consulta-certificados-asistente-video',
  requireAuth,
  configPortal,
  admin.quitarVideoAsistenteCertificadosPortal,
);
router.post(
  '/admin/portal/cursos-conduccion-archivo',
  requireAuth,
  configPortal,
  aulaVirtualCursosConduccion.single('archivo'),
  admin.subirArchivoCursosConduccionPortal,
);
router.post(
  '/admin/portal/examen-teorico-archivo',
  requireAuth,
  configPortal,
  aulaVirtualExamenTeorico.single('archivo'),
  admin.subirArchivoExamenTeoricoPortal,
);
router.post(
  '/admin/portal/mercancias-peligrosas-imagen',
  requireAuth,
  configPortal,
  aulaVirtualMercanciasPeligrosas.single('imagen'),
  admin.subirImagenMercanciasPeligrosasPortal,
);
router.delete(
  '/admin/portal/mercancias-peligrosas-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenMercanciasPeligrosasPortal,
);
router.post(
  '/admin/portal/trabajo-en-alturas-imagen',
  requireAuth,
  configPortal,
  aulaVirtualTrabajoEnAlturas.single('imagen'),
  admin.subirImagenTrabajoEnAlturasPortal,
);
router.delete(
  '/admin/portal/trabajo-en-alturas-imagen',
  requireAuth,
  configPortal,
  admin.quitarImagenTrabajoEnAlturasPortal,
);

router.get('/admin/blog', requireAuth, configPortal, admin.listarBlogAdmin);
router.get('/admin/blog/:id', requireAuth, configPortal, admin.obtenerBlogAdmin);
router.post('/admin/blog', requireAuth, configPortal, admin.crearBlogPost);
router.put('/admin/blog/:id', requireAuth, configPortal, admin.actualizarBlogPost);
router.delete('/admin/blog/:id', requireAuth, configPortal, admin.eliminarBlogPost);
router.post(
  '/admin/blog/imagen',
  requireAuth,
  configPortal,
  aulaVirtualBlog.single('imagen'),
  admin.subirImagenBlog,
);

router.post(
  '/admin/portal/galeria',
  requireAuth,
  requireAdmin,
  aulaVirtualGaleria.array('imagenes', 30),
  admin.subirImagenesGaleriaPortal,
);
router.delete('/admin/portal/galeria', requireAuth, requireAdmin, admin.eliminarFotoGaleriaPortal);

router.post(
  '/admin/portal/home-fotos',
  requireAuth,
  requireAdmin,
  aulaVirtualHomeFotos.single('imagen'),
  admin.subirImagenHomeFotoPortal,
);
router.delete('/admin/portal/home-fotos', requireAuth, requireAdmin, admin.eliminarImagenHomeFotoPortal);

router.post(
  '/admin/portal/home-publicidad',
  requireAuth,
  configPortal,
  aulaVirtualHomePublicidad.single('imagen'),
  admin.subirImagenHomePublicidadPortal,
);
router.delete(
  '/admin/portal/home-publicidad',
  requireAuth,
  configPortal,
  admin.eliminarImagenHomePublicidadPortal,
);

router.post(
  '/admin/portal/cursos-conduccion-publicidad',
  requireAuth,
  configPortal,
  aulaVirtualCursosConduccionPublicidad.single('imagen'),
  admin.subirImagenCursosConduccionPublicidadPortal,
);
router.delete(
  '/admin/portal/cursos-conduccion-publicidad',
  requireAuth,
  configPortal,
  admin.eliminarImagenCursosConduccionPublicidadPortal,
);

module.exports = router;
