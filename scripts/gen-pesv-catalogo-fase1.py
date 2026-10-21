# -*- coding: utf-8 -*-
items = [
(1, None, '¿El PESV está implementado según Res. 1565/2014?', 'Certificación o documento de implementación', 'pdf', 5, None),
(2, None, '¿El PESV está en desarrollo o implementado según Res. 40595/2022?', 'Certificación o evidencia de avance', 'pdf', 5, None),
(3, 1, '¿Designó líder del PESV con poder de decisión articulado al SG-SST?', 'Contrato, acta, HV o nombramiento', 'pdf', 5, None),
(4, 2, '¿Existe Comité de Seguridad Vial?', 'Acta máximo órgano social', 'pdf', 5, 'estandar'),
(5, 3, '¿Cuenta con Política de Seguridad Vial?', 'Política aprobada', 'pdf', 5, None),
(6, 4, '¿La alta dirección hace seguimiento al PESV?', 'Actas de seguimiento', 'pdf', 5, None),
(7, 5, '¿Tiene línea base / primera medición?', 'Evidencia línea base', 'pdf', 5, None),
(8, 5, '¿Realizó diagnóstico del estado actual de seguridad vial?', 'Documento de diagnóstico', 'pdf', 5, None),
(9, 6, '¿Procedimiento de evaluación y control de riesgos viales?', 'Procedimiento documentado', 'pdf', 5, None),
(10, 6, '¿Matriz de riesgos de seguridad vial?', 'Matriz de riesgos', 'xlsx', 5, None),
(11, 7, '¿Los objetivos son conocidos por el personal?', 'Evidencias de difusión', 'pdf', 5, None),
(12, 7, '¿Objetivos y metas definidos?', 'Documento objetivos y metas', 'pdf', 5, None),
(13, 8, 'Política y programa gestión de velocidad', 'Política y programa', 'pdf', 5, None),
(14, 8, 'Política y programa prevención fatiga y somnolencia', 'Política y programa', 'pdf', 5, None),
(15, 8, 'Política y programa gestión distracciones', 'Política y programa', 'pdf', 5, None),
(16, 8, 'Política y programa cero tolerancia alcohol y SPA', 'Política y programa', 'pdf', 5, None),
(17, 8, 'Política y programa protección actores viales vulnerables', 'Política y programa', 'pdf', 5, None),
(18, 8, '¿Políticas de programas críticos conocidas por el personal?', 'Evidencia de difusión', 'pdf', 5, None),
(19, 9, '¿Plan anual de implementación del PESV?', 'Plan anual', 'pdf', 5, None),
(20, 10, '¿Competencias definidas para cargos/roles del paso 10?', 'Manual funciones o perfiles', 'pdf', 5, None),
(21, 10, '¿Plan anual de capacitación de conductores?', 'Plan de capacitación', 'pdf', 5, None),
(22, 11, 'Metodología hábitos seguros en la vía', 'Documento metodología', 'pdf', 5, 'avanzado'),
(23, 11, 'Responsabilidades en comportamiento seguro', 'Documento responsabilidades', 'pdf', 5, 'avanzado'),
(24, 11, 'Evaluación anual de competencias', 'Procedimiento o evidencia', 'pdf', 5, 'avanzado'),
(25, 11, 'Procedimiento evaluación de conductores', 'Procedimiento', 'pdf', 5, 'avanzado'),
(26, 12, 'Plan preparación y respuesta ante emergencias viales', 'Plan de emergencias', 'pdf', 5, None),
(27, 13, 'Metodología investigación de accidentes', 'Metodología', 'pdf', 5, 'estandar'),
(28, 14, 'Gestión vías internas/administradas', 'Procedimiento o evidencia', 'pdf', 5, None),
(29, 14, 'Protocolo vías internas', 'Protocolo', 'pdf', 5, None),
(30, 14, 'Registro y análisis siniestros en vías internas', 'Registro', 'pdf', 5, None),
(31, 14, 'Evaluación riesgos accesos e intersecciones', 'Evaluación', 'pdf', 5, None),
(32, 14, 'Articulación con autoridades de tránsito', 'Evidencia articulación', 'pdf', 5, None),
(33, 15, 'Procedimiento planificación viajes misionales', 'Procedimiento', 'pdf', 5, None),
(34, 16, 'Cobertura inspección preoperacional', 'Evidencia cobertura o N/A', 'na', 5, None),
(35, 16, 'Procedimiento y formato inspección preoperacional', 'Procedimiento y formato', 'pdf', 5, None),
(36, 16, 'Contenido mínimo inspección (paso 16)', 'Formato o checklist', 'pdf', 5, None),
(37, 17, 'Plan mantenimiento preventivo vehículos', 'Plan mantenimiento', 'pdf', 5, None),
(38, 17, 'Hojas de vida de vehículos', 'Hojas de vida', 'pdf', 5, None),
(39, 18, 'Gestión del cambio vinculada al PESV', 'Procedimiento', 'pdf', 5, 'estandar'),
(40, 18, 'Contratistas incluidos en el PESV', 'Evidencia contratistas', 'pdf', 5, 'estandar'),
(41, 18, 'Terceros vinculados al PESV', 'Evidencia terceros', 'pdf', 5, 'estandar'),
(42, 18, 'Supervisión de contratistas/terceros', 'Procedimiento supervisión', 'pdf', 5, 'estandar'),
(43, 18, 'Ítem adicional paso 18 (contratistas)', 'Evidencia o no aplica', 'pdf', 5, 'estandar'),
(44, 19, 'Procedimiento archivo y control documental PESV', 'Procedimiento', 'pdf', 5, None),
(45, 20, 'Registro, medición y análisis indicadores mínimos', 'Registro indicadores', 'pdf', 5, None),
(46, 21, 'Registro estadístico siniestralidad', 'Excel desde 2021', 'xlsx', 5, 'avanzado'),
(47, 22, 'Procedimiento auditoría interna PESV', 'Procedimiento', 'pdf', 5, None),
(48, 22, 'Al menos una auditoría interna en el año', 'Informe auditoría', 'pdf', 5, None),
(49, 23, 'Planes de acción por no conformidades', 'Plan de acción', 'pdf', 5, None),
(50, 24, 'Mecanismos de comunicación documentados e implementados', 'Evidencia comunicación', 'pdf', 5, None),
]
lines = []
lines.append("/** Catálogo Fase 1 SISI-PESV (~50 ítems). Res. 40595 pasos 1–24. */")
lines.append("")
lines.append("const NIVELES_ORDEN = ['basico', 'estandar', 'avanzado'];")
lines.append("")
lines.append("const MOTIVOS_FASE1 = [")
lines.append("  { codigo: 'implementado', label: 'Implementado / documento vigente' },")
lines.append("  { codigo: 'en_desarrollo', label: 'En desarrollo' },")
lines.append("  { codigo: 'no_aplica_nivel', label: 'No aplica al nivel' },")
lines.append("  { codigo: 'no_obligado', label: 'No obligado' },")
lines.append("  { codigo: 'otro', label: 'Otro (detalle en observación)' },")
lines.append("];")
lines.append("")
lines.append("const CATALOGO_FASE1 = [")
for t in items:
    no, paso, preg, ev, fmt, mb, nmin = t
    paso_js = "null" if paso is None else paso
    nmin_js = "null" if nmin is None else f"'{nmin}'"
    lines.append("  {")
    lines.append(f"    itemNo: {no},")
    lines.append(f"    paso40595: {paso_js},")
    lines.append(f"    pregunta: {preg!r},")
    lines.append(f"    evidenciaHint: {ev!r},")
    lines.append(f"    formatoEvidencia: '{fmt}',")
    lines.append(f"    maxMb: {mb},")
    lines.append(f"    nivelMinimo: {nmin_js},")
    lines.append("  },")
lines.append("];")
lines.append("")
lines.append("function nivelIndice(n) {")
lines.append("  const i = NIVELES_ORDEN.indexOf(n);")
lines.append("  return i >= 0 ? i : 0;")
lines.append("}")
lines.append("")
lines.append("function itemAplicaAlNivel(item, nivelOrg) {")
lines.append("  if (!item.nivelMinimo) return true;")
lines.append("  return nivelIndice(nivelOrg) >= nivelIndice(item.nivelMinimo);")
lines.append("}")
lines.append("")
lines.append("function sugerenciaRespuestaItem(item, nivelOrg) {")
lines.append("  if (itemAplicaAlNivel(item, nivelOrg)) return null;")
lines.append("  return { existe: 'no', motivoCodigo: 'no_aplica_nivel' };")
lines.append("}")
lines.append("")
lines.append("module.exports = {")
lines.append("  MOTIVOS_FASE1,")
lines.append("  CATALOGO_FASE1,")
lines.append("  NIVELES_ORDEN,")
lines.append("  itemAplicaAlNivel,")
lines.append("  sugerenciaRespuestaItem,")
lines.append("};")
path = r"c:\proyectos-js\ARGO\argo-backend\src\constants\pesv\catalogoFase1.js"
open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("ok", len(items), path)
