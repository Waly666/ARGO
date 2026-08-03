/**
 * Catálogo base de titulaciones (técnica, tecnológica, universitaria) para
 * alumnos de jornadas · origen institución educativa.
 * No es SNIES completo: listado práctico de programas frecuentes en Colombia.
 */

const TITULACIONES_COLOMBIA = [
  // ── Técnica profesional ──────────────────────────────────────────
  { codigo: 'TEC-ADM', nivel: 'tecnica', nombre: 'Técnico profesional en Administración de empresas' },
  { codigo: 'TEC-CON', nivel: 'tecnica', nombre: 'Técnico profesional en Contabilidad y finanzas' },
  { codigo: 'TEC-MER', nivel: 'tecnica', nombre: 'Técnico profesional en Mercadeo y ventas' },
  { codigo: 'TEC-RH', nivel: 'tecnica', nombre: 'Técnico profesional en Gestión del talento humano' },
  { codigo: 'TEC-LOG', nivel: 'tecnica', nombre: 'Técnico profesional en Logística' },
  { codigo: 'TEC-TUR', nivel: 'tecnica', nombre: 'Técnico profesional en Turismo y hotelería' },
  { codigo: 'TEC-SIS', nivel: 'tecnica', nombre: 'Técnico profesional en Sistemas' },
  { codigo: 'TEC-PROG', nivel: 'tecnica', nombre: 'Técnico profesional en Programación de software' },
  { codigo: 'TEC-RED', nivel: 'tecnica', nombre: 'Técnico profesional en Redes y telecomunicaciones' },
  { codigo: 'TEC-DIS', nivel: 'tecnica', nombre: 'Técnico profesional en Diseño gráfico' },
  { codigo: 'TEC-MUL', nivel: 'tecnica', nombre: 'Técnico profesional en Multimedia' },
  { codigo: 'TEC-ELE', nivel: 'tecnica', nombre: 'Técnico profesional en Electricidad industrial' },
  { codigo: 'TEC-AUT', nivel: 'tecnica', nombre: 'Técnico profesional en Electrónica y automatización' },
  { codigo: 'TEC-MEC', nivel: 'tecnica', nombre: 'Técnico profesional en Mecánica industrial' },
  { codigo: 'TEC-MAU', nivel: 'tecnica', nombre: 'Técnico profesional en Mecánica automotriz' },
  { codigo: 'TEC-SOL', nivel: 'tecnica', nombre: 'Técnico profesional en Soldadura' },
  { codigo: 'TEC-CONOB', nivel: 'tecnica', nombre: 'Técnico profesional en Construcción de obras civiles' },
  { codigo: 'TEC-TOP', nivel: 'tecnica', nombre: 'Técnico profesional en Topografía' },
  { codigo: 'TEC-AMB', nivel: 'tecnica', nombre: 'Técnico profesional en Gestión ambiental' },
  { codigo: 'TEC-SAL', nivel: 'tecnica', nombre: 'Técnico profesional en Salud ocupacional' },
  { codigo: 'TEC-ENF', nivel: 'tecnica', nombre: 'Técnico profesional en Enfermería' },
  { codigo: 'TEC-FAR', nivel: 'tecnica', nombre: 'Técnico profesional en Farmacia' },
  { codigo: 'TEC-LAB', nivel: 'tecnica', nombre: 'Técnico profesional en Laboratorio clínico' },
  { codigo: 'TEC-ODO', nivel: 'tecnica', nombre: 'Técnico profesional en Salud oral' },
  { codigo: 'TEC-GAS', nivel: 'tecnica', nombre: 'Técnico profesional en Gastronomía' },
  { codigo: 'TEC-PAN', nivel: 'tecnica', nombre: 'Técnico profesional en Panadería y pastelería' },
  { codigo: 'TEC-AGR', nivel: 'tecnica', nombre: 'Técnico profesional en Agropecuaria' },
  { codigo: 'TEC-VET', nivel: 'tecnica', nombre: 'Técnico profesional en Veterinaria' },
  { codigo: 'TEC-SEG', nivel: 'tecnica', nombre: 'Técnico profesional en Seguridad y vigilancia' },
  { codigo: 'TEC-TRA', nivel: 'tecnica', nombre: 'Técnico profesional en Transporte y tránsito' },
  { codigo: 'TEC-CONDU', nivel: 'tecnica', nombre: 'Técnico profesional en Conducción de vehículos' },
  { codigo: 'TEC-OTRA', nivel: 'tecnica', nombre: 'Otra titulación técnica' },

  // ── Tecnológica ──────────────────────────────────────────────────
  { codigo: 'TGL-ADM', nivel: 'tecnologica', nombre: 'Tecnólogo en Administración de empresas' },
  { codigo: 'TGL-FIN', nivel: 'tecnologica', nombre: 'Tecnólogo en Gestión financiera' },
  { codigo: 'TGL-CON', nivel: 'tecnologica', nombre: 'Tecnólogo en Contabilidad y costos' },
  { codigo: 'TGL-MER', nivel: 'tecnologica', nombre: 'Tecnólogo en Mercadeo' },
  { codigo: 'TGL-COM', nivel: 'tecnologica', nombre: 'Tecnólogo en Comercio internacional' },
  { codigo: 'TGL-RH', nivel: 'tecnologica', nombre: 'Tecnólogo en Gestión humana' },
  { codigo: 'TGL-LOG', nivel: 'tecnologica', nombre: 'Tecnólogo en Logística' },
  { codigo: 'TGL-TUR', nivel: 'tecnologica', nombre: 'Tecnólogo en Turismo' },
  { codigo: 'TGL-SIS', nivel: 'tecnologica', nombre: 'Tecnólogo en Sistemas' },
  { codigo: 'TGL-ADS', nivel: 'tecnologica', nombre: 'Tecnólogo en Análisis y desarrollo de software' },
  { codigo: 'TGL-INF', nivel: 'tecnologica', nombre: 'Tecnólogo en Gestión de la información' },
  { codigo: 'TGL-RED', nivel: 'tecnologica', nombre: 'Tecnólogo en Redes de datos' },
  { codigo: 'TGL-TEL', nivel: 'tecnologica', nombre: 'Tecnólogo en Telecomunicaciones' },
  { codigo: 'TGL-ELE', nivel: 'tecnologica', nombre: 'Tecnólogo en Electricidad' },
  { codigo: 'TGL-ELT', nivel: 'tecnologica', nombre: 'Tecnólogo en Electrónica' },
  { codigo: 'TGL-AUT', nivel: 'tecnologica', nombre: 'Tecnólogo en Automatización industrial' },
  { codigo: 'TGL-MEC', nivel: 'tecnologica', nombre: 'Tecnólogo en Mecánica industrial' },
  { codigo: 'TGL-MAU', nivel: 'tecnologica', nombre: 'Tecnólogo en Mecánica automotriz' },
  { codigo: 'TGL-DIS', nivel: 'tecnologica', nombre: 'Tecnólogo en Diseño industrial' },
  { codigo: 'TGL-DIG', nivel: 'tecnologica', nombre: 'Tecnólogo en Diseño gráfico digital' },
  { codigo: 'TGL-PRO', nivel: 'tecnologica', nombre: 'Tecnólogo en Producción industrial' },
  { codigo: 'TGL-CAL', nivel: 'tecnologica', nombre: 'Tecnólogo en Calidad' },
  { codigo: 'TGL-AMB', nivel: 'tecnologica', nombre: 'Tecnólogo en Gestión ambiental' },
  { codigo: 'TGL-SST', nivel: 'tecnologica', nombre: 'Tecnólogo en Seguridad y salud en el trabajo' },
  { codigo: 'TGL-SAL', nivel: 'tecnologica', nombre: 'Tecnólogo en Atención prehospitalaria' },
  { codigo: 'TGL-RAD', nivel: 'tecnologica', nombre: 'Tecnólogo en Radiología e imágenes diagnósticas' },
  { codigo: 'TGL-REG', nivel: 'tecnologica', nombre: 'Tecnólogo en Regencia de farmacia' },
  { codigo: 'TGL-GAS', nivel: 'tecnologica', nombre: 'Tecnólogo en Gastronomía' },
  { codigo: 'TGL-AGR', nivel: 'tecnologica', nombre: 'Tecnólogo en Producción agropecuaria' },
  { codigo: 'TGL-MIN', nivel: 'tecnologica', nombre: 'Tecnólogo en Minería' },
  { codigo: 'TGL-OBR', nivel: 'tecnologica', nombre: 'Tecnólogo en Obras civiles' },
  { codigo: 'TGL-TRA', nivel: 'tecnologica', nombre: 'Tecnólogo en Gestión del transporte' },
  { codigo: 'TGL-OTRA', nivel: 'tecnologica', nombre: 'Otra titulación tecnológica' },

  // ── Universitaria / profesional ──────────────────────────────────
  { codigo: 'UNI-ADM', nivel: 'universidad', nombre: 'Administración de empresas' },
  { codigo: 'UNI-CON', nivel: 'universidad', nombre: 'Contaduría pública' },
  { codigo: 'UNI-ECO', nivel: 'universidad', nombre: 'Economía' },
  { codigo: 'UNI-FIN', nivel: 'universidad', nombre: 'Finanzas y comercio internacional' },
  { codigo: 'UNI-MER', nivel: 'universidad', nombre: 'Mercadeo' },
  { codigo: 'UNI-NEG', nivel: 'universidad', nombre: 'Negocios internacionales' },
  { codigo: 'UNI-DER', nivel: 'universidad', nombre: 'Derecho' },
  { codigo: 'UNI-PSI', nivel: 'universidad', nombre: 'Psicología' },
  { codigo: 'UNI-COM', nivel: 'universidad', nombre: 'Comunicación social' },
  { codigo: 'UNI-PER', nivel: 'universidad', nombre: 'Periodismo' },
  { codigo: 'UNI-PUB', nivel: 'universidad', nombre: 'Publicidad' },
  { codigo: 'UNI-DIS', nivel: 'universidad', nombre: 'Diseño gráfico' },
  { codigo: 'UNI-DIN', nivel: 'universidad', nombre: 'Diseño industrial' },
  { codigo: 'UNI-ARQ', nivel: 'universidad', nombre: 'Arquitectura' },
  { codigo: 'UNI-INGC', nivel: 'universidad', nombre: 'Ingeniería civil' },
  { codigo: 'UNI-INGS', nivel: 'universidad', nombre: 'Ingeniería de sistemas' },
  { codigo: 'UNI-INGI', nivel: 'universidad', nombre: 'Ingeniería industrial' },
  { codigo: 'UNI-INGE', nivel: 'universidad', nombre: 'Ingeniería electrónica' },
  { codigo: 'UNI-INGL', nivel: 'universidad', nombre: 'Ingeniería eléctrica' },
  { codigo: 'UNI-INGM', nivel: 'universidad', nombre: 'Ingeniería mecánica' },
  { codigo: 'UNI-INGQ', nivel: 'universidad', nombre: 'Ingeniería química' },
  { codigo: 'UNI-INGA', nivel: 'universidad', nombre: 'Ingeniería ambiental' },
  { codigo: 'UNI-INGT', nivel: 'universidad', nombre: 'Ingeniería de telecomunicaciones' },
  { codigo: 'UNI-INGR', nivel: 'universidad', nombre: 'Ingeniería de software' },
  { codigo: 'UNI-INGP', nivel: 'universidad', nombre: 'Ingeniería de petroleum / minas' },
  { codigo: 'UNI-MED', nivel: 'universidad', nombre: 'Medicina' },
  { codigo: 'UNI-ENF', nivel: 'universidad', nombre: 'Enfermería' },
  { codigo: 'UNI-ODO', nivel: 'universidad', nombre: 'Odontología' },
  { codigo: 'UNI-FAR', nivel: 'universidad', nombre: 'Química farmacéutica' },
  { codigo: 'UNI-FIS', nivel: 'universidad', nombre: 'Fisioterapia' },
  { codigo: 'UNI-NUT', nivel: 'universidad', nombre: 'Nutrición y dietética' },
  { codigo: 'UNI-TER', nivel: 'universidad', nombre: 'Terapia ocupacional' },
  { codigo: 'UNI-FON', nivel: 'universidad', nombre: 'Fonoaudiología' },
  { codigo: 'UNI-VET', nivel: 'universidad', nombre: 'Medicina veterinaria' },
  { codigo: 'UNI-ZOO', nivel: 'universidad', nombre: 'Zootecnia' },
  { codigo: 'UNI-AGR', nivel: 'universidad', nombre: 'Ingeniería agronómica' },
  { codigo: 'UNI-BIO', nivel: 'universidad', nombre: 'Biología' },
  { codigo: 'UNI-QUI', nivel: 'universidad', nombre: 'Química' },
  { codigo: 'UNI-MAT', nivel: 'universidad', nombre: 'Matemáticas' },
  { codigo: 'UNI-FISIC', nivel: 'universidad', nombre: 'Física' },
  { codigo: 'UNI-EST', nivel: 'universidad', nombre: 'Estadística' },
  { codigo: 'UNI-LICM', nivel: 'universidad', nombre: 'Licenciatura en Matemáticas' },
  { codigo: 'UNI-LICL', nivel: 'universidad', nombre: 'Licenciatura en Lengua castellana' },
  { codigo: 'UNI-LICI', nivel: 'universidad', nombre: 'Licenciatura en Inglés' },
  { codigo: 'UNI-LICN', nivel: 'universidad', nombre: 'Licenciatura en Ciencias naturales' },
  { codigo: 'UNI-LICS', nivel: 'universidad', nombre: 'Licenciatura en Ciencias sociales' },
  { codigo: 'UNI-LICE', nivel: 'universidad', nombre: 'Licenciatura en Educación física' },
  { codigo: 'UNI-LICP', nivel: 'universidad', nombre: 'Licenciatura en Educación preescolar' },
  { codigo: 'UNI-LICB', nivel: 'universidad', nombre: 'Licenciatura en Educación básica' },
  { codigo: 'UNI-TRAB', nivel: 'universidad', nombre: 'Trabajo social' },
  { codigo: 'UNI-SOC', nivel: 'universidad', nombre: 'Sociología' },
  { codigo: 'UNI-ANT', nivel: 'universidad', nombre: 'Antropología' },
  { codigo: 'UNI-HIS', nivel: 'universidad', nombre: 'Historia' },
  { codigo: 'UNI-FIL', nivel: 'universidad', nombre: 'Filosofía' },
  { codigo: 'UNI-MUS', nivel: 'universidad', nombre: 'Música' },
  { codigo: 'UNI-ART', nivel: 'universidad', nombre: 'Artes plásticas' },
  { codigo: 'UNI-DEP', nivel: 'universidad', nombre: 'Profesional en deporte' },
  { codigo: 'UNI-TUR', nivel: 'universidad', nombre: 'Administración turística y hotelera' },
  { codigo: 'UNI-GAS', nivel: 'universidad', nombre: 'Gastronomía' },
  { codigo: 'UNI-OTRA', nivel: 'universidad', nombre: 'Otra titulación universitaria' },
];

const NIVELES_TITULACION = ['tecnica', 'tecnologica', 'universidad'];

function normalizarNivelTitulacion(raw) {
  const t = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (NIVELES_TITULACION.includes(t)) return t;
  if (t.includes('tecnic') && !t.includes('tecnolog')) return 'tecnica';
  if (t.includes('tecnolog')) return 'tecnologica';
  if (t.includes('univers') || t.includes('profesion') || t.includes('pregrad')) return 'universidad';
  return '';
}

function listarTitulaciones({ nivel = '', q = '', limit = 80 } = {}) {
  const niv = normalizarNivelTitulacion(nivel);
  const qq = String(q || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  let rows = TITULACIONES_COLOMBIA;
  if (niv) rows = rows.filter((r) => r.nivel === niv);
  if (qq) {
    rows = rows.filter((r) => {
      const n = r.nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return n.includes(qq) || r.codigo.toLowerCase().includes(qq);
    });
  }
  const lim = Math.min(Math.max(1, parseInt(limit, 10) || 80), 200);
  return rows.slice(0, lim).map((r) => ({
    codigo: r.codigo,
    nivel: r.nivel,
    nombre: r.nombre,
    label: r.nombre,
    hint: r.nivel === 'tecnica' ? 'Técnica' : r.nivel === 'tecnologica' ? 'Tecnológica' : 'Universitaria',
  }));
}

function buscarTitulacionPorCodigo(codigo) {
  const c = String(codigo || '').trim().toUpperCase();
  if (!c) return null;
  return TITULACIONES_COLOMBIA.find((r) => r.codigo === c) || null;
}

module.exports = {
  TITULACIONES_COLOMBIA,
  NIVELES_TITULACION,
  normalizarNivelTitulacion,
  listarTitulaciones,
  buscarTitulacionPorCodigo,
};
