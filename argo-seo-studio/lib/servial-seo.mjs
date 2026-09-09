import { SERVIAL_PORTAFOLIO_PAGE_KEYS, SERVIAL_SERVICIOS_DEFAULT } from './catalog.mjs';

export function profileEsServial(profile) {
  const txt = `${profile?.marca ?? ''} ${profile?.nombreCea ?? ''} ${profile?.dominio ?? ''}`.toLowerCase();
  return txt.includes('servial');
}

export function servialProfileDefaults(label = 'Servial Colombia') {
  return {
    marca: label.trim() || 'Servial Colombia',
    nombreCea: 'CEA Servial Colombia',
    ciudad: 'Villavicencio',
    region: 'Meta',
    pais: 'Colombia',
    dominio: '',
    serviciosSeleccionados: [...SERVIAL_SERVICIOS_DEFAULT],
    serviciosCustom: [],
    incluirPortafolio: true,
    paginasPortafolio: [...SERVIAL_PORTAFOLIO_PAGE_KEYS],
    notas:
      'Fuerte: licencias A2/B1/C1–C3 con clases en carro y moto; cursos no formales (manejo defensivo, primeros auxilios, normas de tránsito, mercancías peligrosas, extintores); aula virtual; asesoría en trámites. Institución seria en Villavicencio.',
  };
}

function str(v) {
  return String(v ?? '').trim();
}

function truncate(text, max = 158) {
  const t = str(text).replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function truncateTitle(text, max = 62) {
  const t = str(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function marca(p) {
  return str(p.marca) || str(p.nombreCea) || 'Servial Colombia';
}

function cea(p) {
  return str(p.nombreCea) || marca(p);
}

function loc(p) {
  const ciudad = str(p.ciudad) || 'Villavicencio';
  const region = str(p.region) || 'Meta';
  return `${ciudad}, ${region}`;
}

function kw(p, extra = []) {
  return [
    ...extra,
    marca(p),
    cea(p),
    `CEA ${str(p.ciudad) || 'Villavicencio'}`,
    loc(p),
  ]
    .filter(Boolean)
    .join(', ');
}

export function buildServialHome(profile) {
  const titulo = truncateTitle(`Licencia de conducción y cursos | ${marca(profile)}`);
  const descripcion = truncate(
    `${cea(profile)} en ${loc(profile)}: licencias A2, B1, C1, C2 y C3 con clases en carro y moto. Cursos de manejo defensivo, primeros auxilios, normas de tránsito, mercancías peligrosas y aula virtual. Institución seria y confiable.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'licencia de conducción Villavicencio',
      'CEA Villavicencio',
      'cursos no formales',
      'aula virtual Servial',
      'manejo defensivo',
      'mercancías peligrosas',
      'clases de conducción',
    ]),
  };
}

export function buildServialCursos(profile) {
  const titulo = truncateTitle(`Cursos no formales y licencias | ${marca(profile)}`);
  const descripcion = truncate(
    `Catálogo de ${cea(profile)}: manejo defensivo, primeros auxilios, normas de tránsito, curso obligatorio de mercancías peligrosas, extintores e incendios, y programas para licencia de conducción en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'cursos no formales Villavicencio',
      'curso manejo defensivo',
      'curso primeros auxilios',
      'curso normas de tránsito',
      'curso mercancías peligrosas',
      'curso extintores',
    ]),
  };
}

export function buildServialTienda(profile) {
  const titulo = truncateTitle(`Inscripción a cursos y aula virtual | ${marca(profile)}`);
  const descripcion = truncate(
    `Matricúlese en línea a cursos virtuales y presenciales de ${cea(profile)}. Capacitación certificada para conductores y empresas en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['aula virtual Servial', 'cursos virtuales Villavicencio', 'matricular curso']),
  };
}

export function buildServialAcerca(profile) {
  const titulo = truncateTitle(`CEA e instituto en Villavicencio | ${marca(profile)}`);
  const descripcion = truncate(
    `${cea(profile)}: Centro de Enseñanza Automovilística e Instituto para el Trabajo, habilitado ante Mintransporte. Licencias, cursos no formales, aula virtual y asesoría en trámites. Institución seria y confiable en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'CEA Servial Colombia',
      'institución seria Villavicencio',
      'centro de enseñanza automovilística',
      'contacto Servial',
    ]),
  };
}

export function buildServialFundacion(profile) {
  const titulo = truncateTitle(`${cea(profile)} | ${loc(profile)}`);
  const descripcion = truncate(
    `CEA habilitado (Resoluciones Mintransporte) e Instituto de Educación para el Trabajo. Instructores autorizados, clases en vehículos, cursos libres y calidad certificada en formación vial. ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['CEA habilitado', 'TÜV Rheinland', 'instructores Mintransporte', 'calidad formación vial']),
  };
}

export function buildServialConsultaCertificados(profile) {
  const titulo = truncateTitle(`Consulta de certificados | ${marca(profile)}`);
  const descripcion = truncate(
    `Verifique certificados expedidos por ${cea(profile)}: manejo defensivo, mercancías peligrosas, primeros auxilios y demás cursos. Consulta por documento en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['consulta certificados Servial', 'verificar certificado', 'certificado manejo defensivo']),
  };
}

export function buildServialCursosConduccion(profile) {
  const titulo = truncateTitle(`Licencias A2, B1, C1, C2 y C3 | ${marca(profile)}`);
  const descripcion = truncate(
    `Obtenga su licencia de conducción en ${loc(profile)}: moto (A2), particular (B1) y servicio público o carga (C1, C2, C3). Clases teóricas y prácticas en carros y motos con instructores certificados de ${cea(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'licencia A2 Villavicencio',
      'licencia B1',
      'licencia C1 C2 C3',
      'clases prácticas carro',
      'clases prácticas moto',
      'aprender a manejar Villavicencio',
    ]),
  };
}

export function buildServialExamenTeorico(profile) {
  const titulo = truncateTitle(`Examen teórico y trámite de licencia | ${marca(profile)}`);
  const descripcion = truncate(
    `Prepárese para el examen teórico y el trámite RUNT con ${cea(profile)}. Orientación para obtener o recategorizar la licencia de conducción en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['examen teórico licencia', 'trámite RUNT', 'recategorización licencia', 'asesoría trámites']),
  };
}

export function buildServialMercanciasPeligrosas(profile) {
  const titulo = truncateTitle(`Curso obligatorio mercancías peligrosas | ${marca(profile)}`);
  const descripcion = truncate(
    `Curso básico obligatorio de transporte de mercancías peligrosas (Decreto 1609). Seguridad, emergencias y normativa para conductores y empresas. ${cea(profile)}, ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'curso obligatorio mercancías peligrosas',
      'Decreto 1609',
      'transporte sustancias peligrosas',
      'curso mercancías peligrosas Villavicencio',
    ]),
  };
}

export function buildServialTrabajoEnAlturas(profile) {
  const titulo = truncateTitle(`Trabajo en alturas sector transporte | ${marca(profile)}`);
  const descripcion = truncate(
    `Formación en trabajo seguro en alturas para el sector transportador. Normativa y buenas prácticas con ${cea(profile)} en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['trabajo en alturas', 'Resolución 4272', 'seguridad sector transporte']),
  };
}

export function buildServialBlog(profile) {
  const titulo = truncateTitle(`Guías de licencia y cursos viales | ${marca(profile)}`);
  const descripcion = truncate(
    `Artículos sobre licencia de conducción, cursos no formales, aula virtual y trámites de tránsito en ${loc(profile)}. Novedades de ${cea(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['blog Servial', 'guía licencia de conducción', 'cursos seguridad vial Villavicencio']),
  };
}

export function buildServialGaleria(profile) {
  const titulo = truncateTitle(`Galería: clases, sede y formación | ${marca(profile)}`);
  const descripcion = truncate(
    `Fotos de clases prácticas en carros y motos, sede e instructores de ${cea(profile)} en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['galería Servial', 'clases de conducción Villavicencio']),
  };
}

export function buildServialPqr(profile) {
  const titulo = truncateTitle(`PQR — Peticiones y reclamos | ${marca(profile)}`);
  const descripcion = truncate(
    `Canal oficial de peticiones, quejas, reclamos y sugerencias de ${cea(profile)}. Atención seria y oportuna en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `PQR, ${marca(profile)}, peticiones quejas reclamos`,
  };
}

export function buildServialJornadas(profile) {
  const titulo = truncateTitle(`Capacitación presencial para empresas | ${marca(profile)}`);
  const descripcion = truncate(
    `Jornadas y cursos presenciales de seguridad vial, manejo defensivo y mercancías peligrosas para empresas de transporte. ${cea(profile)}, ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['jornadas capacitación', 'cursos empresas transporte', 'capacitación presencial Villavicencio']),
  };
}

export function buildServialEvaluacionJornadas(profile) {
  const titulo = truncateTitle(`Evaluación de jornadas de capacitación | ${marca(profile)}`);
  const descripcion = truncate(
    `Encuesta de satisfacción de jornadas y cursos presenciales de ${cea(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: `evaluación jornadas, ${marca(profile)}`,
  };
}

export function buildServialServiciosHub(profile) {
  const titulo = truncateTitle(`Servicios de Capacitación en Villavicencio | ${marca(profile)}`);
  const descripcion = truncate(
    `Conoce los servicios y cursos de ${marca(profile)} en Villavicencio, Meta: conducción, seguridad vial, transporte y formación especializada para personas y empresas.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'servicios SERVIAL Villavicencio',
      'cursos en Villavicencio',
      'capacitaciones en Villavicencio',
      'capacitación empresarial Villavicencio',
      'cursos de seguridad vial Villavicencio',
      'formación para conductores Villavicencio',
    ]),
  };
}

export function buildServialServicioAulaVirtual(profile) {
  const titulo = truncateTitle('Aula Virtual y Cursos Online | SERVIAL Colombia');
  const descripcion = truncate(
    'Acceda al Aula Virtual de SERVIAL Colombia: cursos online en seguridad vial, tránsito, transporte y formación especializada para estudiantes y empresas en todo el país.',
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'aula virtual SERVIAL',
      'cursos virtuales SERVIAL',
      'cursos virtuales Villavicencio',
      'capacitación virtual Villavicencio',
      'cursos online Colombia',
      'cursos seguridad vial virtuales',
      'cursos virtuales Meta',
    ]),
  };
}

export function buildServialServicioPeridata(profile) {
  const titulo = truncateTitle(`Asesoría en trámites de tránsito | ${marca(profile)}`);
  const descripcion = truncate(
    `Asesoría en normas, trámites y consultas de tránsito y transporte. Orientación seria y ágil para conductores y empresas. ${cea(profile)}, ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'asesoría trámites de tránsito',
      'trámites licencia Villavicencio',
      'consultas organismos de tránsito',
    ]),
  };
}

export function buildServialServicioCapacitacion(profile) {
  const titulo = truncateTitle(`Cursos y capacitación vial | ${marca(profile)}`);
  const descripcion = truncate(
    `Cursos no formales de ${cea(profile)}: mercancías peligrosas, manejo defensivo, normas de tránsito, primeros auxilios, extintores, HSE y competencias laborales. ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, [
      'capacitación Servial Colombia',
      'cursos no formales',
      'manejo defensivo',
      'primeros auxilios',
      'mercancías peligrosas',
      'manejo de extintores',
    ]),
  };
}

export function buildServialServicioEstudios(profile) {
  const titulo = truncateTitle(`Estudios de tránsito y movilidad | ${marca(profile)}`);
  const descripcion = truncate(
    `Estudios de tránsito y movilidad en ${loc(profile)}: diagnóstico vial, seguridad y señalización para entidades y empresas. ${cea(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['estudios de tránsito', 'movilidad Villavicencio', 'señalización vial']),
  };
}

export function buildServialServicioHerramientas(profile) {
  const titulo = truncateTitle(`Soluciones informáticas | ${marca(profile)}`);
  const descripcion = truncate(
    `Soluciones informáticas de ${cea(profile)}: aula virtual, gestión documental y herramientas para el sector transportador en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['soluciones informáticas Servial', 'aula virtual', 'gestión documental']),
  };
}

export function buildServialServicioInventarios(profile) {
  const titulo = truncateTitle(`Inventarios viales | ${marca(profile)}`);
  const descripcion = truncate(
    `Servicios de inventario y diagnóstico vial con ${cea(profile)} en ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['inventarios viales']),
  };
}

export function buildServialServicioConsultoria(profile) {
  const titulo = truncateTitle(`Consultoría en tránsito y transporte | ${marca(profile)}`);
  const descripcion = truncate(
    `Consultoría de ${cea(profile)}: planes de manejo de tránsito, PESV Ley 1503, creación de empresas de transporte y asesoría legal en accidentes. ${loc(profile)}.`,
  );
  return {
    titulo,
    descripcion,
    keywords: kw(profile, ['consultoría tránsito', 'PESV', 'Ley 1503', 'planes de manejo de tránsito']),
  };
}

export const SERVIAL_BUILDERS = {
  home: (p) => buildServialHome(p),
  cursos: (p) => buildServialCursos(p),
  tienda: (p) => buildServialTienda(p),
  acerca: (p) => buildServialAcerca(p),
  fundacion: (p) => buildServialFundacion(p),
  consultaCertificados: (p) => buildServialConsultaCertificados(p),
  cursosConduccion: (p) => buildServialCursosConduccion(p),
  examenTeorico: (p) => buildServialExamenTeorico(p),
  mercanciasPeligrosas: (p) => buildServialMercanciasPeligrosas(p),
  trabajoEnAlturas: (p) => buildServialTrabajoEnAlturas(p),
  serviciosHub: (p) => buildServialServiciosHub(p),
  servicio_aulaVirtual: (p) => buildServialServicioAulaVirtual(p),
  servicio_peridata: (p) => buildServialServicioPeridata(p),
  servicio_capacitacionSensibilizacion: (p) => buildServialServicioCapacitacion(p),
  servicio_estudiosDiagnosticosTecnicos: (p) => buildServialServicioEstudios(p),
  servicio_herramientasEducativasTecnologicas: (p) => buildServialServicioHerramientas(p),
  servicio_inventariosViales: (p) => buildServialServicioInventarios(p),
  servicio_planeacionGestionVial: (p) => buildServialServicioConsultoria(p),
  blog: (p) => buildServialBlog(p),
  galeria: (p) => buildServialGaleria(p),
  pqr: (p) => buildServialPqr(p),
  jornadasCapacitacion: (p) => buildServialJornadas(p),
  evaluacionJornadas: (p) => buildServialEvaluacionJornadas(p),
};

export function ideasBlogServial(profile) {
  const ciudad = str(profile.ciudad) || 'Villavicencio';
  return [
    {
      titulo: `Cómo sacar la licencia de conducción A2 (moto) en ${ciudad}`,
      keywords: 'licencia A2, moto, CEA Villavicencio',
    },
    {
      titulo: `Licencia B1 particular: clases prácticas en carro en ${ciudad}`,
      keywords: 'licencia B1, clases de conducción, aprender a manejar',
    },
    {
      titulo: 'Curso obligatorio de mercancías peligrosas: a quién aplica',
      keywords: 'mercancías peligrosas, Decreto 1609, curso obligatorio',
    },
    {
      titulo: 'Manejo defensivo y primeros auxilios: cursos para conductores',
      keywords: 'manejo defensivo, primeros auxilios, cursos no formales',
    },
    {
      titulo: 'Manejo de extintores y control de incendios en el sector transporte',
      keywords: 'extintores, control de incendios, HSE',
    },
    {
      titulo: `Trámites de tránsito en ${ciudad}: en qué le asesora un CEA`,
      keywords: 'trámites de tránsito, asesoría, RUNT',
    },
  ];
}
