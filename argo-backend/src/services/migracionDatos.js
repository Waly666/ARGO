const mongoose = require('mongoose');
const XLSX = require('xlsx');

const DatosAlumno = require('../models/DatosAlumno');
const Matricula = require('../models/Matricula');
const Liquidacion = require('../models/Liquidacion');
const Ingreso = require('../models/Ingreso');
const Certificado = require('../models/Certificado');
const Config = require('../models/Config');
const { models: cat } = require('../models/catalogos');
const { parseNumDoc, numDocInvalidMessage } = require('../utils/numDoc');
const {
  num,
  maxNumericId,
  insertarCatalogo,
  generarCodigoProg,
  buscarPrograma,
  sincronizarServicioPrograma,
  listarServiciosMatricula,
} = require('./programaServicio');
const { cargarIndiceTipCap, resolverIdTipCapCanonico } = require('./tipoCapacitacionMatch');
const { esProgramaJornadasCap } = require('./jornadaCapacitacion');
const { normalizarTipoCertificado } = require('./clasificacionCertificado');
const {
  normalizarModalidadesPrograma,
  esSoloVirtual,
  valorMatriculaPrograma,
} = require('./programaModalidad');
const {
  MODALIDAD_VIRTUAL,
  MODALIDAD_PRESENCIAL,
} = require('../constants/modalidadPrograma');
const { CLAVE: CLAVE_CERT } = require('./configCertificado');
const { CLAVE: CLAVE_RECIBO } = require('./configRecibo');
const { ID_PROG_HISTORICO } = require('../constants/migracionHistorico');
const { vincularPagoMigradoALiquidaciones } = require('./migracionMovimientos');
const Gestor = require('../models/Gestor');
const Cliente = require('../models/Cliente');
const { TARIFA_GESTOR, TARIFA_EMPRESA } = require('../constants/tarifa');
const { snapshotReferidorComercial, snapshotReferidorDesdeMatricula } = require('./gestorEmpresaMatricula');
const progreso = require('./progresoOperacion');

/** Historial de lotes de migración. */
const MigracionLote =
  mongoose.models.MigracionLote ||
  mongoose.model(
    'MigracionLote',
    new mongoose.Schema({}, { collection: 'migracionLotes', strict: false, timestamps: true }),
  );

const HOJAS = {
  programas: 'Programas',
  gestores: 'Gestores',
  empresas: 'Empresas',
  alumnos: 'Alumnos',
  matriculas: 'Matriculas',
  pagos: 'Pagos',
  certificados: 'Certificados',
};

const CLAVES_HOJAS = Object.keys(HOJAS);

/**
 * Normaliza la selección de qué migrar (dinámico por cliente):
 * acepta array o cadena "alumnos,certificados". Vacío/inválido = todas.
 */
function normalizarHojas(raw) {
  let lista = raw;
  if (typeof raw === 'string') lista = raw.split(',');
  if (!Array.isArray(lista)) return [...CLAVES_HOJAS];
  const sel = lista
    .map((h) => String(h || '').trim().toLowerCase())
    .filter((h) => CLAVES_HOJAS.includes(h));
  return sel.length ? sel : [...CLAVES_HOJAS];
}

/** Integridad relacional: completa (default) o histórica para certificados sin alumno/programa. */
function normalizarOpcionesIntegridad(raw = {}) {
  const certificadosHistoricos =
    raw.certificadosHistoricos === true
    || raw.certificadosHistoricos === 'true'
    || raw.modoIntegridad === 'historica'
    || raw.modoIntegridad === 'parcial';
  return {
    modoIntegridad: certificadosHistoricos ? 'historica' : 'completa',
    certificadosHistoricos,
    exigirAlumnoEnCertificados: !certificadosHistoricos,
    exigirProgramaEnCertificados: !certificadosHistoricos,
  };
}

const COLUMNAS = {
  programas: [
    'codigoPrograma', 'nombrePrograma', 'tipoCapacitacion', 'modalidad', 'horas', 'semestres',
    'diasVencimiento', 'tarifa1', 'tarifa2', 'tarifa3', 'tarifaVirtual', 'tarifaGestor', 'tarifaEmpresa',
  ],
  gestores: [
    'numero', 'tipoDoc', 'nombres', 'apellidos', 'seudonimo', 'correo', 'celular', 'direccion',
  ],
  empresas: [
    'identificacion', 'dv', 'tipoDocumento', 'razonSocial', 'nombreComercial', 'nombres',
    'direccion', 'correo', 'telefono', 'municipio', 'tipoContratoCap',
  ],
  alumnos: [
    'numDoc', 'tipoDoc', 'nombre1', 'nombre2', 'apellido1', 'apellido2',
    'fechaNacimiento', 'genero', 'celular', 'correo', 'direccion', 'municipio', 'observaciones',
    'manejoGestorEmpresa', 'tipoReferidor', 'gestorNumero', 'empresaReferidorIdentificacion',
  ],
  matriculas: [
    'numDoc', 'codigoPrograma', 'refMatricula', 'fechaMatricula', 'tarifa', 'tipoReferidor', 'gestorNumero',
    'empresaReferidorIdentificacion', 'valorTotal', 'valorPagado', 'estado', 'observaciones',
  ],
  pagos: [
    'numDoc', 'codigoPrograma', 'refMatricula', 'numeroRecibo', 'fecha', 'valor', 'formaPago', 'concepto', 'observaciones',
  ],
  certificados: [
    'numDoc', 'nombreTitular', 'codVerificacion', 'codigoPrograma', 'codigoCertificado', 'nombreCurso', 'horas',
    'fechaEmision', 'fechaVencimiento', 'numActa', 'numFolio', 'numRunt', 'estado',
    'tipoReferidor', 'gestorNumero', 'empresaReferidorIdentificacion',
  ],
};

const EJEMPLOS = {
  programas: [{
    codigoPrograma: '101', nombrePrograma: 'CURSO DE CONDUCCIÓN B1',
    tipoCapacitacion: 'Licencia de conducción', modalidad: 'Presencial', horas: 40, semestres: '',
    diasVencimiento: 365, tarifa1: 1200000, tarifa2: '', tarifa3: '', tarifaVirtual: '', tarifaGestor: 1100000, tarifaEmpresa: 1050000,
  }, {
    codigoPrograma: '201', nombrePrograma: 'CURSO PRIMER RESPONDIENTE (VIRTUAL)',
    tipoCapacitacion: 'Curso', modalidad: 'Virtual', horas: 20, semestres: '',
    diasVencimiento: 365, tarifa1: '', tarifa2: '', tarifa3: '', tarifaVirtual: 150000, tarifaGestor: '', tarifaEmpresa: '',
  }],
  gestores: [{
    numero: '80123456', tipoDoc: 'CC', nombres: 'MARIA', apellidos: 'LOPEZ', seudonimo: 'MARILO',
    correo: 'gestor@correo.com', celular: '3001112233', direccion: '',
  }],
  empresas: [{
    identificacion: '900123456', dv: '7', tipoDocumento: '31',
    razonSocial: 'TRANSPORTES EL LLANO S.A.S.', nombreComercial: 'Transportes El Llano',
    nombres: '', direccion: 'Calle 10 # 5-20', correo: 'contacto@empresa.com', telefono: '6081234567',
    municipio: 'Villavicencio', tipoContratoCap: 'juridica_empresa',
  }],
  alumnos: [{
    numDoc: 1098765432, tipoDoc: 'CC', nombre1: 'JUAN', nombre2: 'CARLOS',
    apellido1: 'PEREZ', apellido2: 'GOMEZ', fechaNacimiento: '1995-04-23', genero: 'Masculino',
    celular: '3001234567', correo: 'juan@correo.com', direccion: 'Calle 1 # 2-3',
    municipio: 'Bucaramanga', observaciones: '', manejoGestorEmpresa: 'SI', tipoReferidor: 'gestor',
    gestorNumero: '80123456', empresaReferidorIdentificacion: '',
  }],
  matriculas: [{
    numDoc: 1098765432, codigoPrograma: '101', refMatricula: 'MAT-2024-0001', fechaMatricula: '2024-02-15', tarifa: 5,
    tipoReferidor: 'gestor', gestorNumero: '80123456', empresaReferidorIdentificacion: '',
    valorTotal: 1100000, valorPagado: 0, estado: 'Activo', observaciones: '',
  }],
  pagos: [{
    numDoc: 1098765432, codigoPrograma: '101', refMatricula: 'MAT-2024-0001', numeroRecibo: 'RC-00125',
    fecha: '2024-02-15', valor: 800000, formaPago: 'Efectivo', concepto: 'Abono curso de conducción', observaciones: '',
  }],
  certificados: [{
    numDoc: 1098765432, nombreTitular: 'JUAN CARLOS PEREZ GOMEZ', codVerificacion: 'VRF-2024-000045',
    codigoPrograma: '', codigoCertificado: 'CERT-000045', nombreCurso: 'Curso de conducción B1', horas: 40,
    fechaEmision: '2024-06-30', fechaVencimiento: '', numActa: '', numFolio: '', numRunt: '',
    estado: 'vigente',
  }],
};

/** Filas de ayuda por hoja: [campo, obligatorio, descripción, ejemplo] */
const AYUDA_COLUMNAS = {
  programas: [
    ['codigoPrograma', 'Sí', 'Código único del curso en su sistema anterior. Debe ser el mismo en Matrículas, Pagos y Certificados.', '101'],
    ['nombrePrograma', 'Sí', 'Nombre completo del programa o curso.', 'CURSO DE CONDUCCIÓN B1'],
    ['tipoCapacitacion', 'Sí', 'Debe coincidir con un tipo del catálogo de ARGO (Académico → Tipos de capacitación).', 'Licencia de conducción'],
    ['modalidad', 'No', 'Presencial, Virtual o Mixta. Si va vacío, ARGO lo deduce de las tarifas que llene.', 'Presencial'],
    ['horas', 'No', 'Duración en horas del curso.', '40'],
    ['semestres', 'No', 'Vacío = un solo cobro. Con número, el valor se divide en cuotas semestrales.', ''],
    ['diasVencimiento', 'No', 'Días de vigencia del certificado asociado al programa.', '365'],
    ['tarifa1', 'Condicional', 'Precio matrícula presencial (tarifa 1). Obligatorio si modalidad es Presencial o Mixta.', '1200000'],
    ['tarifa2', 'No', 'Precio alternativo presencial (tarifa 2).', ''],
    ['tarifa3', 'No', 'Precio alternativo presencial (tarifa 3).', ''],
    ['tarifaVirtual', 'Condicional', 'Precio aula virtual (tarifa 4). Obligatorio si modalidad es Virtual o Mixta.', '150000'],
    ['tarifaGestor', 'No', 'Precio para matrículas con tarifa 5 (gestor/tramitador).', '1100000'],
    ['tarifaEmpresa', 'No', 'Precio para matrículas con tarifa 6 (empresa referidora).', '1050000'],
  ],
  gestores: [
    ['numero', 'Sí', 'Documento del gestor/tramitador, sin puntos ni espacios.', '80123456'],
    ['tipoDoc', 'No', 'Tipo de documento. Por defecto CC.', 'CC'],
    ['nombres', 'Sí', 'Nombres del gestor.', 'MARIA'],
    ['apellidos', 'Sí', 'Apellidos del gestor.', 'LOPEZ'],
    ['seudonimo', 'No', 'Nombre corto o alias para reportes.', 'MARILO'],
    ['correo', 'No', 'Correo electrónico de contacto.', 'gestor@correo.com'],
    ['celular', 'No', 'Teléfono móvil.', '3001112233'],
    ['direccion', 'No', 'Dirección de contacto.', ''],
  ],
  empresas: [
    ['identificacion', 'Sí', 'NIT o documento de la empresa, sin puntos.', '900123456'],
    ['dv', 'No', 'Dígito de verificación (solo NIT).', '7'],
    ['tipoDocumento', 'No', '31 = NIT (empresa), 13 = CC (persona natural). Por defecto 31.', '31'],
    ['razonSocial', 'Sí*', 'Razón social. *Para persona natural puede usar el campo nombres.', 'TRANSPORTES EL LLANO S.A.S.'],
    ['nombreComercial', 'No', 'Nombre comercial o marca.', 'Transportes El Llano'],
    ['nombres', 'No', 'Nombre completo si el cliente es persona natural.', ''],
    ['direccion', 'No', 'Dirección fiscal o de contacto.', 'Calle 10 # 5-20'],
    ['correo', 'No', 'Correo de la empresa.', 'contacto@empresa.com'],
    ['telefono', 'No', 'Teléfono fijo o celular.', '6081234567'],
    ['municipio', 'No', 'Ciudad o municipio.', 'Villavicencio'],
    ['tipoContratoCap', 'No', 'Tipo de contrato de capacitación (juridica_empresa, etc.).', 'juridica_empresa'],
  ],
  alumnos: [
    ['numDoc', 'Sí', 'Número de documento del alumno, sin puntos ni espacios (6 a 14 dígitos).', '1098765432'],
    ['tipoDoc', 'No', 'CC, CE, TI, PA, etc. Por defecto CC.', 'CC'],
    ['nombre1', 'Sí', 'Primer nombre.', 'JUAN'],
    ['nombre2', 'No', 'Segundo nombre.', 'CARLOS'],
    ['apellido1', 'Sí', 'Primer apellido.', 'PEREZ'],
    ['apellido2', 'No', 'Segundo apellido.', 'GOMEZ'],
    ['fechaNacimiento', 'No', 'Fecha de nacimiento (AAAA-MM-DD o DD/MM/AAAA).', '1995-04-23'],
    ['genero', 'No', 'Masculino, Femenino u otro valor del catálogo.', 'Masculino'],
    ['celular', 'No', 'Teléfono móvil del alumno.', '3001234567'],
    ['correo', 'No', 'Correo electrónico.', 'juan@correo.com'],
    ['direccion', 'No', 'Dirección de residencia.', 'Calle 1 # 2-3'],
    ['municipio', 'No', 'Ciudad o municipio de residencia.', 'Bucaramanga'],
    ['observaciones', 'No', 'Notas internas sobre el alumno.', ''],
    ['manejoGestorEmpresa', 'No', 'SI = el alumno viene referido por gestor o empresa.', 'SI'],
    ['tipoReferidor', 'No', 'gestor o empresa. Requerido si manejoGestorEmpresa = SI.', 'gestor'],
    ['gestorNumero', 'No', 'Documento del gestor (debe existir en hoja Gestores o en ARGO).', '80123456'],
    ['empresaReferidorIdentificacion', 'No', 'NIT de la empresa referidora (hoja Empresas o ARGO).', ''],
  ],
  matriculas: [
    ['numDoc', 'Sí', 'Documento del alumno. Debe existir en hoja Alumnos o ya en ARGO.', '1098765432'],
    ['codigoPrograma', 'Sí', 'Código del curso (hoja Programas o ARGO → Programas).', '101'],
    ['refMatricula', 'Recomendado', 'ID único de la matrícula en su sistema anterior. Obligatorio si el alumno tiene varios cursos o varias matrículas al mismo programa.', 'MAT-2024-0001'],
    ['fechaMatricula', 'No', 'Fecha en que se matriculó. Si va vacía, se usa la fecha de importación.', '2024-02-15'],
    ['tarifa', 'No', '1 a 4 = tarifas normales. 5 = gestor. 6 = empresa. Por defecto 1.', '5'],
    ['tipoReferidor', 'Condicional', 'gestor o empresa. Obligatorio si tarifa es 5 o 6.', 'gestor'],
    ['gestorNumero', 'Condicional', 'Documento del gestor. Obligatorio si tarifa 5.', '80123456'],
    ['empresaReferidorIdentificacion', 'Condicional', 'NIT de la empresa. Obligatorio si tarifa 6.', ''],
    ['valorTotal', 'No', 'Valor total del curso para esta matrícula. Crea la liquidación con este monto.', '1100000'],
    ['valorPagado', 'No', 'Abonos ya registrados en el sistema anterior. Saldo = valorTotal − valorPagado. Si importará pagos en la hoja Pagos, deje este campo en 0.', '0'],
    ['estado', 'No', 'Estado de la matrícula (Activo, Retirado, etc.). Por defecto Activo.', 'Activo'],
    ['observaciones', 'No', 'Notas sobre la matrícula.', ''],
  ],
  pagos: [
    ['numDoc', 'Sí', 'Documento del alumno que realizó el pago.', '1098765432'],
    ['codigoPrograma', 'Recomendado', 'Curso al que corresponde el pago. Obligatorio si el alumno tiene más de una matrícula.', '101'],
    ['refMatricula', 'Recomendado', 'Debe coincidir con refMatricula de la hoja Matriculas. Más preciso que codigoPrograma cuando hay varias matrículas al mismo curso.', 'MAT-2024-0001'],
    ['numeroRecibo', 'No', 'Número de recibo del sistema anterior. Si va vacío, ARGO genera uno automático.', 'RC-00125'],
    ['fecha', 'No', 'Fecha del pago (AAAA-MM-DD o DD/MM/AAAA).', '2024-02-15'],
    ['valor', 'Sí', 'Monto pagado en pesos, sin símbolos. Solo números.', '800000'],
    ['formaPago', 'No', 'Efectivo, Transferencia, Cheque, Tarjeta debito, Tarjeta de Credito, etc.', 'Efectivo'],
    ['concepto', 'No', 'Descripción del pago que aparecerá en el recibo migrado.', 'Abono curso de conducción'],
    ['observaciones', 'No', 'Notas adicionales del recibo.', ''],
  ],
  certificados: [
    ['numDoc', 'Sí', 'Documento del titular del certificado.', '1098765432'],
    ['nombreTitular', 'Recomendado', 'Nombre completo impreso en el certificado y consulta pública del Aula Virtual.', 'JUAN CARLOS PEREZ GOMEZ'],
    ['codVerificacion', 'No', 'Código de verificación que verá el alumno en la consulta pública.', 'VRF-2024-000045'],
    ['codigoPrograma', 'Condicional', 'Código del programa en ARGO. Si existe, vincula el certificado al curso. Si va vacío o no existe, se importa como histórico.', '101'],
    ['codigoCertificado', 'No', 'Número o código interno del certificado en su sistema anterior.', 'CERT-000045'],
    ['nombreCurso', 'Recomendado', 'Nombre del curso impreso en el certificado. Obligatorio si es certificado histórico sin programa en ARGO.', 'Curso de conducción B1'],
    ['horas', 'No', 'Horas certificadas.', '40'],
    ['fechaEmision', 'Sí', 'Fecha de emisión del certificado.', '2024-06-30'],
    ['fechaVencimiento', 'No', 'Fecha de vencimiento. Vacío si no aplica.', ''],
    ['numActa', 'No', 'Número de acta (conducción / RUNT).', ''],
    ['numFolio', 'No', 'Número de folio.', ''],
    ['numRunt', 'No', 'Número RUNT si aplica.', ''],
    ['estado', 'No', 'vigente o anulado. Por defecto vigente.', 'vigente'],
    ['tipoReferidor', 'No', 'gestor o empresa (snapshot del referidor al emitir).', ''],
    ['gestorNumero', 'No', 'Documento del gestor referidor.', ''],
    ['empresaReferidorIdentificacion', 'No', 'NIT de la empresa referidora.', ''],
  ],
};

const TITULOS_AYUDA = {
  programas: 'HOJA PROGRAMAS — Catálogo de cursos',
  gestores: 'HOJA GESTORES — Tramitadores (tarifa 5)',
  empresas: 'HOJA EMPRESAS — Clientes / empresas referidoras (tarifa 6)',
  alumnos: 'HOJA ALUMNOS — Datos personales',
  matriculas: 'HOJA MATRÍCULAS — Inscripciones a cursos',
  pagos: 'HOJA PAGOS — Recibos históricos',
  certificados: 'HOJA CERTIFICADOS — Certificados emitidos',
};

const RESUMEN_AYUDA = {
  programas: 'Cree aquí los cursos que aún no existen en ARGO. Si ya los tiene en Académico → Programas, puede omitir esta hoja y usar los mismos codigoPrograma en las demás hojas.',
  gestores: 'Opcional. Solo necesaria si tiene matrículas con tarifa 5 (gestor/tramitador). Los gestores también pueden existir ya en ARGO.',
  empresas: 'Opcional. Solo necesaria si tiene matrículas con tarifa 6 (empresa referidora). Las empresas también pueden existir en Configuración → Clientes.',
  alumnos: 'Una fila por alumno. Los datos básicos son numDoc, nombre1 y apellido1. El resto enriquece la ficha del alumno en ARGO.',
  matriculas: 'Una fila por cada inscripción de un alumno a un curso. Un mismo alumno con B1 y A2 lleva dos filas con distinto codigoPrograma. valorTotal crea la deuda; valorPagado registra lo ya abonado en el sistema anterior.',
  pagos: 'Una fila por cada recibo o abono histórico. Si el alumno tiene varios cursos, indique codigoPrograma o refMatricula para que el pago se aplique al curso correcto.',
  certificados: 'Una fila por certificado emitido. Puede vincularse a un programa de ARGO o importarse como histórico con nombreCurso.',
};

function pushBloque(filas, lineas) {
  for (const ln of lineas) filas.push([ln]);
}

function pushTablaColumnas(filas, clave) {
  const filasCol = AYUDA_COLUMNAS[clave];
  if (!filasCol) return;
  filas.push(['Campo', 'Obligatorio', 'Descripción', 'Ejemplo / valores']);
  for (const row of filasCol) filas.push(row);
}

function instrucciones(hojasSel, opciones = {}) {
  const opts = normalizarOpcionesIntegridad(opciones);
  const filas = [];

  pushBloque(filas, [
    'PLANTILLA DE MIGRACIÓN DE DATOS — ARGO',
    `Hojas incluidas en este archivo: ${hojasSel.map((h) => HOJAS[h]).join(', ')}`,
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '1. PASOS GENERALES',
    '══════════════════════════════════════════════════════════════════════════════',
    '① Exporte los datos de su aplicación anterior (Access, Excel, otro software).',
    '② Copie y pegue los datos en las hojas correspondientes de este archivo.',
    '③ NO cambie los nombres de las hojas ni de las columnas de la fila 1.',
    '④ Borre las filas de ejemplo (fila 2 en adelante) antes de importar sus datos reales.',
    '⑤ En el ERP vaya a: Configuración → Migración de datos → Validar archivo.',
    '⑥ Revise los errores reportados, corríjalos en el Excel y vuelva a validar.',
    '⑦ Cuando la validación esté en verde, pulse Importar.',
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '2. ORDEN RECOMENDADO AL LLENAR EL ARCHIVO',
    '══════════════════════════════════════════════════════════════════════════════',
    'Respete este orden lógico (las hojas que no incluya en su plantilla se omiten):',
    '  1. Programas  →  2. Gestores  →  3. Empresas  →  4. Alumnos',
    '  5. Matrículas  →  6. Pagos  →  7. Certificados',
    'Cada hoja depende de las anteriores: una matrícula requiere alumno y programa; un pago requiere alumno y matrícula.',
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '3. FORMATOS Y REGLAS COMUNES',
    '══════════════════════════════════════════════════════════════════════════════',
    '• numDoc: número de documento SIN puntos, comas ni espacios (6 a 14 dígitos). Ej: 1098765432',
    '• Fechas: AAAA-MM-DD (2024-02-15) o DD/MM/AAAA (15/02/2024). No use texto como "15 feb".',
    '• Valores en pesos: solo números, sin $ ni separadores de miles. Ej: 1200000 (no 1.200.000).',
    '• codigoPrograma: código del curso. Debe ser IDÉNTICO en Programas, Matrículas, Pagos y Certificados.',
    '• Celdas vacías: déjelas en blanco; no escriba "N/A", "-" ni "0" si el dato no aplica.',
    '• Mayúsculas/minúsculas: en la mayoría de campos no importa, salvo valores específicos (gestor/empresa, vigente/anulado).',
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '4. SALDOS Y PAGOS — MUY IMPORTANTE',
    '══════════════════════════════════════════════════════════════════════════════',
    'Opción A — Solo matrículas (más simple):',
    '  Ponga en valorTotal el precio del curso y en valorPagado lo que el alumno ya pagó.',
    '  ARGO calculará el saldo pendiente automáticamente. No use la hoja Pagos.',
    '',
    'Opción B — Matrículas + pagos detallados (recomendado si tiene muchos abonos):',
    '  En Matrículas: valorTotal = precio del curso, valorPagado = 0.',
    '  En Pagos: una fila por cada recibo, con codigoPrograma o refMatricula.',
    '  NO mezcle las dos opciones para el mismo curso (no ponga valorPagado Y pagos separados).',
    '',
    'Alumno con VARIOS cursos (ej. B1 y A2):',
    '  • Dos filas en Matrículas, cada una con distinto codigoPrograma.',
    '  • Use refMatricula (ID único del sistema anterior) en cada matrícula.',
    '  • En Pagos, indique codigoPrograma o refMatricula en CADA recibo.',
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '5. DETALLE POR HOJA',
    '══════════════════════════════════════════════════════════════════════════════',
    '',
  ]);

  for (const h of hojasSel) {
    filas.push([TITULOS_AYUDA[h] || `HOJA ${HOJAS[h].toUpperCase()}`]);
    filas.push([RESUMEN_AYUDA[h] || '']);
    filas.push(['']);
    pushTablaColumnas(filas, h);
    filas.push(['']);
  }

  if (opts.certificadosHistoricos && hojasSel.includes('certificados')) {
    pushBloque(filas, [
      '══════════════════════════════════════════════════════════════════════════════',
      'MODO CERTIFICADOS HISTÓRICOS',
      '══════════════════════════════════════════════════════════════════════════════',
      '• No se exige que el alumno ni el programa existan en ARGO.',
      '• nombreTitular se muestra en la consulta pública del Aula Virtual.',
      '• codigoPrograma es opcional; si no existe en ARGO, use nombreCurso.',
      '',
    ]);
  } else if (!hojasSel.includes('alumnos')) {
    pushBloque(filas, [
      '══════════════════════════════════════════════════════════════════════════════',
      'AVISO — SIN HOJA ALUMNOS',
      '══════════════════════════════════════════════════════════════════════════════',
      'Esta plantilla no incluye la hoja Alumnos. Los numDoc de Matrículas, Pagos y Certificados',
      'deben existir ya en ARGO; de lo contrario la validación marcará error en esas filas.',
      '',
    ]);
  }

  if (
    !opts.certificadosHistoricos
    && !hojasSel.includes('programas')
    && (hojasSel.includes('matriculas') || hojasSel.includes('certificados'))
  ) {
    pushBloque(filas, [
      '══════════════════════════════════════════════════════════════════════════════',
      'AVISO — SIN HOJA PROGRAMAS',
      '══════════════════════════════════════════════════════════════════════════════',
      'Esta plantilla no incluye la hoja Programas. Los codigoPrograma referenciados deben',
      'existir ya en ARGO (Académico → Programas); de lo contrario esas filas saldrán con error.',
      '',
    ]);
  }

  pushBloque(filas, [
    '══════════════════════════════════════════════════════════════════════════════',
    '6. ERRORES FRECUENTES Y CÓMO EVITARLOS',
    '══════════════════════════════════════════════════════════════════════════════',
    '✗ Documento con puntos (1.098.765.432) → use solo dígitos: 1098765432',
    '✗ codigoPrograma distinto entre hojas (101 en Matrículas, B1 en Pagos) → unifique el código',
    '✗ Pago sin codigoPrograma cuando el alumno tiene varios cursos → el saldo queda mal distribuido',
    '✗ valorPagado en matrícula Y pagos en hoja Pagos para el mismo curso → se duplica el abono',
    '✗ tipoCapacitacion que no existe en ARGO → créelo antes o use el nombre exacto del catálogo',
    '✗ Fecha en formato texto ("enero 2024") → use AAAA-MM-DD o DD/MM/AAAA',
    '✗ Filas de ejemplo sin borrar → la importación intentará crear datos de prueba',
    '',
    '══════════════════════════════════════════════════════════════════════════════',
    '7. SOPORTE',
    '══════════════════════════════════════════════════════════════════════════════',
    'Si la validación muestra errores, lea el mensaje: indica hoja, fila y causa.',
    'Corrija en el Excel y vuelva a validar hasta que no haya errores.',
    'Puede descargar una nueva plantilla en cualquier momento desde Configuración → Migración.',
  ]);

  return filas;
}

function generarPlantilla(hojas, opciones = {}) {
  const hojasSel = normalizarHojas(hojas);
  const wb = XLSX.utils.book_new();
  const wsInstr = XLSX.utils.aoa_to_sheet(instrucciones(hojasSel, opciones));
  wsInstr['!cols'] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 72 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');
  for (const clave of hojasSel) {
    const ws = XLSX.utils.json_to_sheet(EJEMPLOS[clave], { header: COLUMNAS[clave] });
    ws['!cols'] = COLUMNAS[clave].map((c) => ({ wch: Math.max(14, c.length + 4) }));
    XLSX.utils.book_append_sheet(wb, ws, HOJAS[clave]);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function parseFecha(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === 'number') {
    // Serial de Excel
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return new Date(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, d.S || 0);
    return null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseValor(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[$.\s]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function normalizarFormaPago(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return undefined;
  if (s.startsWith('efect')) return 'Efectivo';
  if (s.startsWith('transf') || s.includes('consign')) return 'Transferencia';
  if (s.startsWith('cheq')) return 'Cheque';
  if (s.includes('debito') || s.includes('débito')) return 'Tarjeta debito';
  if (s.includes('credito') || s.includes('crédito') || s.includes('tarjeta')) return 'Tarjeta de Credito';
  return undefined;
}

function leerHoja(wb, nombre) {
  const ws = wb.Sheets[nombre];
  if (!ws) return [];
  const filas = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
  // __rowNum__ es 0-based incluyendo encabezado → fila Excel = +1
  return filas.map((f) => ({ ...f, _fila: (f.__rowNum__ ?? 0) + 1 }));
}

function str(v) {
  return String(v ?? '').trim();
}

function parseSiNo(v) {
  const s = str(v).toLowerCase();
  return s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'yes';
}

function normalizarTipoReferidor(v) {
  const s = str(v).toLowerCase();
  if (s === 'gestor' || s === 'g') return 'gestor';
  if (s === 'empresa' || s === 'e') return 'empresa';
  return null;
}

function parseTarifaMigracion(v) {
  if (v == null || v === '') return 1;
  const n = Number(String(v).replace(/[^\d]/g, ''));
  if (n === TARIFA_GESTOR || n === TARIFA_EMPRESA) return n;
  if (n >= 1 && n <= 4) return n;
  const s = str(v).toLowerCase();
  if (s.includes('gestor')) return TARIFA_GESTOR;
  if (s.includes('empresa')) return TARIFA_EMPRESA;
  if (s.includes('virtual')) return 4;
  return 1;
}

async function resolverGestorPorNumero(numero, cache = new Map()) {
  const n = str(numero);
  if (!n) return null;
  if (cache.has(n)) return cache.get(n);
  const g = await Gestor.findOne({ numero: n, activo: { $ne: false } }).lean();
  cache.set(n, g);
  return g;
}

function normIdEmpresa(identificacion) {
  return str(identificacion).replace(/\D/g, '');
}

async function resolverEmpresaReferidor(identificacion, cache = new Map()) {
  const raw = str(identificacion);
  if (!raw) return null;
  const norm = normIdEmpresa(raw);
  const keys = [raw, norm].filter(Boolean);
  for (const k of keys) {
    if (cache.has(k)) return cache.get(k);
  }
  const or = [{ identificacion: raw }];
  if (norm && norm !== raw) or.push({ identificacion: norm });
  const cli = await Cliente.findOne({
    activo: { $ne: false },
    $or: or,
  }).lean();
  for (const k of keys) cache.set(k, cli);
  return cli;
}

/**
 * Resuelve referidor comercial desde fila Excel o datos del alumno.
 * @returns {Promise<{ tipo: string|null, gestor: object|null, empresa: object|null, error?: string }>}
 */
async function resolverReferidorMigracion(fila, alumno, tarifa, caches = {}) {
  const cacheGestor = caches.gestores || new Map();
  const cacheEmpresa = caches.empresas || new Map();
  if (tarifa !== TARIFA_GESTOR && tarifa !== TARIFA_EMPRESA) {
    return { tipo: null, gestor: null, empresa: null };
  }

  let tipo = normalizarTipoReferidor(fila?.tipoReferidor) || normalizarTipoReferidor(alumno?.tipoReferidorComercial);
  if (!tipo) tipo = tarifa === TARIFA_GESTOR ? 'gestor' : 'empresa';

  if (tipo === 'gestor') {
    const numero = str(fila?.gestorNumero) || str(alumno?.gestorNombre) || '';
    let gestor = numero ? await resolverGestorPorNumero(numero, cacheGestor) : null;
    if (!gestor && alumno?.gestorId) {
      gestor = await Gestor.findById(alumno.gestorId).lean();
    }
    if (!gestor) {
      return { tipo, gestor: null, empresa: null, error: `Gestor "${numero || '?'}" no encontrado` };
    }
    return { tipo, gestor, empresa: null };
  }

  const idEmp = str(fila?.empresaReferidorIdentificacion) || '';
  let empresa = idEmp ? await resolverEmpresaReferidor(idEmp, cacheEmpresa) : null;
  if (!empresa && alumno?.referidorEmpresaId) {
    empresa = await Cliente.findById(alumno.referidorEmpresaId).lean();
  }
  if (!empresa) {
    return { tipo, gestor: null, empresa: null, error: `Empresa referidora "${idEmp || '?'}" no encontrada` };
  }
  return { tipo, gestor: null, empresa };
}

function alumnoReferidorPayload(referidor) {
  if (!referidor?.tipo) {
    return {
      manejoGestorEmpresa: false,
      tipoReferidorComercial: null,
      gestorId: null,
      gestorNombre: null,
      referidorEmpresaId: null,
      referidorEmpresaNombre: null,
    };
  }
  if (referidor.tipo === 'gestor' && referidor.gestor) {
    const g = referidor.gestor;
    const nombre =
      str(g.seudonimo) ||
      [g.nombres, g.apellidos].filter(Boolean).join(' ').trim() ||
      str(g.numero);
    return {
      manejoGestorEmpresa: true,
      tipoReferidorComercial: 'gestor',
      gestorId: g._id,
      gestorNombre: nombre,
      referidorEmpresaId: null,
      referidorEmpresaNombre: null,
    };
  }
  if (referidor.tipo === 'empresa' && referidor.empresa) {
    const c = referidor.empresa;
    const nombre =
      c.razonSocial?.trim() ||
      c.nombreComercial?.trim() ||
      c.nombres?.trim() ||
      str(c.identificacion);
    return {
      manejoGestorEmpresa: true,
      tipoReferidorComercial: 'empresa',
      gestorId: null,
      gestorNombre: null,
      referidorEmpresaId: c._id,
      referidorEmpresaNombre: nombre,
    };
  }
  return {
    manejoGestorEmpresa: false,
    tipoReferidorComercial: null,
    gestorId: null,
    gestorNombre: null,
    referidorEmpresaId: null,
    referidorEmpresaNombre: null,
  };
}

/** Resuelve el tipo de capacitación y si es jornada (sin cobro al alumno). */
async function resolverTipoCap(raw, indiceTipCap) {
  const indice =
    indiceTipCap && typeof indiceTipCap === 'object' && indiceTipCap.byCanon
      ? indiceTipCap
      : await cargarIndiceTipCap();
  const idTipCap = resolverIdTipCapCanonico(raw, indice) || str(raw);
  const esJornada = await esProgramaJornadasCap({ idTipCap, nombreProg: '' });
  return { idTipCap, esJornada };
}

/**
 * Deduce las modalidades de un programa de la migración: usa la columna
 * `modalidad` si viene; si no, las infiere de las tarifas (tarifaVirtual =>
 * virtual; tarifa1 => presencial).
 */
function modalidadesDeFila(fila) {
  const explicit = normalizarModalidadesPrograma(
    str(fila.modalidad) ? [fila.modalidad] : [],
  );
  if (explicit.length) return explicit;
  const mods = [];
  const tienePres = num(fila.tarifa1) > 0;
  const tieneVirtual = num(fila.tarifaVirtual) > 0;
  if (tienePres || !tieneVirtual) mods.push(MODALIDAD_PRESENCIAL);
  if (tieneVirtual) mods.push(MODALIDAD_VIRTUAL);
  return mods.length ? mods : [MODALIDAD_PRESENCIAL];
}

/**
 * Crea un programa (y su servicio de matrícula con tarifas) replicando la
 * lógica del alta normal: idPrograma/codigoProg, servicio vía
 * sincronizarServicioPrograma. Reutilizable desde la migración.
 */
async function crearProgramaConServicio(fila, indiceTipCap, usuario) {
  const { idTipCap, esJornada } = await resolverTipoCap(fila.tipoCapacitacion, indiceTipCap);
  const nombreProg = str(fila.nombrePrograma).toUpperCase();
  const tarifa1 = num(fila.tarifa1);
  const tarifaVirtual = num(fila.tarifaVirtual);
  const modalidades = esJornada ? [] : modalidadesDeFila(fila);
  const soloVirtual = !esJornada && esSoloVirtual(modalidades);
  const valorMatricula = esJornada
    ? 0
    : valorMatriculaPrograma({ modalidades }, [], { tarifa1, tarifaVirtual });

  let codigoProg = str(fila.codigoPrograma);
  if (!codigoProg) codigoProg = await generarCodigoProg(idTipCap);

  const now = new Date();
  const semestres =
    fila.semestres != null && str(fila.semestres) !== '' ? Number(fila.semestres) : null;
  const idPrograma = await maxNumericId(cat.programas, 'idPrograma');
  const progDoc = {
    idPrograma,
    codigoProg,
    nombreProg,
    nomCert: nombreProg,
    idTipCap,
    semestres: Number.isFinite(semestres) && semestres >= 1 ? semestres : null,
    horas: str(fila.horas) !== '' ? Number(fila.horas) : null,
    valorMatricula,
    estado: 'ACTIVO',
    diasVencimiento: str(fila.diasVencimiento) !== '' ? Number(fila.diasVencimiento) : 365,
    tipoCertificado: normalizarTipoCertificado(null),
    ...(esJornada ? {} : { modalidades }),
    migrado: true,
    fechaAudi: now,
    userAddReg: usuario,
    fechaMod: now,
    userChangeRecord: usuario,
  };
  const prog = await insertarCatalogo(cat.programas, progDoc);

  if (!esJornada) {
    await sincronizarServicioPrograma(
      prog,
      {
        tarifa1: soloVirtual ? num(fila.tarifa1) || undefined : tarifa1,
        tarifa2: num(fila.tarifa2) || undefined,
        tarifa3: num(fila.tarifa3) || undefined,
        tarifaVirtual: tarifaVirtual || undefined,
        tarifaGestor: num(fila.tarifaGestor) || undefined,
        tarifaEmpresa: num(fila.tarifaEmpresa) || undefined,
      },
      { username: usuario },
    );
  }
  return prog;
}

/**
 * Lee y valida el archivo. Devuelve filas normalizadas y errores por hoja.
 * No escribe en la base de datos.
 * `hojas` define qué se migra (dinámico por cliente): las hojas no
 * seleccionadas se ignoran aunque tengan datos.
 */
async function analizarArchivo(buffer, hojas, opcionesIntegridad = {}) {
  const hojasSel = normalizarHojas(hojas);
  const opts = normalizarOpcionesIntegridad(opcionesIntegridad);
  const activa = (h) => hojasSel.includes(h);
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    const err = new Error('No se pudo leer el archivo. Use la plantilla Excel (.xlsx) de ARGO.');
    err.status = 400;
    throw err;
  }

  const datos = {
    programas: activa('programas') ? leerHoja(wb, HOJAS.programas) : [],
    gestores: activa('gestores') ? leerHoja(wb, HOJAS.gestores) : [],
    empresas: activa('empresas') ? leerHoja(wb, HOJAS.empresas) : [],
    alumnos: activa('alumnos') ? leerHoja(wb, HOJAS.alumnos) : [],
    matriculas: activa('matriculas') ? leerHoja(wb, HOJAS.matriculas) : [],
    pagos: activa('pagos') ? leerHoja(wb, HOJAS.pagos) : [],
    certificados: activa('certificados') ? leerHoja(wb, HOJAS.certificados) : [],
  };

  /** Hojas con datos en el archivo pero excluidas de la selección. */
  const ignoradas = CLAVES_HOJAS.filter(
    (h) => !activa(h) && leerHoja(wb, HOJAS[h]).length > 0,
  ).map((h) => HOJAS[h]);

  const indice = activa('programas') ? await cargarIndiceTipCap() : null;

  const errores = [];
  const addErr = (hoja, fila, mensaje) => errores.push({ hoja, fila, mensaje });

  // --- Programas (se crean primero; matrículas y certificados pueden referenciarlos) ---
  const programasValidos = [];
  const codigosProgramaArchivo = new Set();
  const vistosCodigo = new Set();
  for (const f of datos.programas) {
    const codigo = str(f.codigoPrograma);
    if (!codigo) {
      addErr(HOJAS.programas, f._fila, 'codigoPrograma es obligatorio');
      continue;
    }
    if (vistosCodigo.has(codigo.toLowerCase())) {
      addErr(HOJAS.programas, f._fila, `codigoPrograma "${codigo}" repetido en el archivo`);
      continue;
    }
    vistosCodigo.add(codigo.toLowerCase());
    if (!str(f.nombrePrograma)) {
      addErr(HOJAS.programas, f._fila, `Programa ${codigo}: nombrePrograma es obligatorio`);
      continue;
    }
    if (!str(f.tipoCapacitacion)) {
      addErr(HOJAS.programas, f._fila, `Programa ${codigo}: tipoCapacitacion es obligatorio`);
      continue;
    }
    const { idTipCap, esJornada } = await resolverTipoCap(f.tipoCapacitacion, indice);
    if (!idTipCap) {
      addErr(HOJAS.programas, f._fila, `Programa ${codigo}: tipoCapacitacion "${f.tipoCapacitacion}" no se reconoce`);
      continue;
    }
    if (!esJornada) {
      const modalidades = modalidadesDeFila(f);
      const soloVirtual = esSoloVirtual(modalidades);
      const tienePres = modalidades.some((m) => m !== MODALIDAD_VIRTUAL);
      if (soloVirtual && num(f.tarifaVirtual) <= 0) {
        addErr(HOJAS.programas, f._fila, `Programa ${codigo}: modalidad Virtual requiere tarifaVirtual mayor a 0`);
        continue;
      }
      if (tienePres && num(f.tarifa1) <= 0) {
        addErr(HOJAS.programas, f._fila, `Programa ${codigo}: tarifa1 (valor de matrícula) debe ser mayor a 0`);
        continue;
      }
      if (modalidades.includes(MODALIDAD_VIRTUAL) && num(f.tarifaVirtual) <= 0) {
        addErr(HOJAS.programas, f._fila, `Programa ${codigo}: modalidad Virtual requiere tarifaVirtual mayor a 0`);
        continue;
      }
    }
    codigosProgramaArchivo.add(codigo.toLowerCase());
    programasValidos.push({ _fila: f._fila, codigo, doc: f });
  }

  const gestoresValidos = [];
  const vistosGestor = new Set();
  const cacheGestoresAnalisis = new Map();
  for (const f of datos.gestores) {
    const numero = str(f.numero);
    if (!numero) {
      addErr(HOJAS.gestores, f._fila, 'numero (documento) es obligatorio');
      continue;
    }
    if (vistosGestor.has(numero)) {
      addErr(HOJAS.gestores, f._fila, `Gestor ${numero} repetido en el archivo`);
      continue;
    }
    vistosGestor.add(numero);
    if (!str(f.nombres) || !str(f.apellidos)) {
      addErr(HOJAS.gestores, f._fila, `Gestor ${numero}: nombres y apellidos son obligatorios`);
      continue;
    }
    gestoresValidos.push({ _fila: f._fila, numero, doc: f });
    cacheGestoresAnalisis.set(numero, {
      numero,
      nombres: str(f.nombres),
      apellidos: str(f.apellidos),
      seudonimo: str(f.seudonimo),
    });
  }

  const empresasValidas = [];
  const vistosEmpresa = new Set();
  const cacheEmpresasAnalisis = new Map();
  for (const f of datos.empresas) {
    const identificacion = str(f.identificacion);
    const norm = normIdEmpresa(identificacion);
    if (!identificacion) {
      addErr(HOJAS.empresas, f._fila, 'identificacion (NIT o documento) es obligatoria');
      continue;
    }
    const clave = norm || identificacion;
    if (vistosEmpresa.has(clave)) {
      addErr(HOJAS.empresas, f._fila, `Empresa ${identificacion} repetida en el archivo`);
      continue;
    }
    vistosEmpresa.add(clave);
    const razonSocial = str(f.razonSocial);
    const nombres = str(f.nombres);
    if (!razonSocial && !nombres) {
      addErr(HOJAS.empresas, f._fila, `Empresa ${identificacion}: razonSocial o nombres es obligatorio`);
      continue;
    }
    const tipoContratoCap = str(f.tipoContratoCap);
    if (tipoContratoCap && !['juridica_empresa', 'juridica_oficial', 'juridica_ong', 'persona_natural'].includes(tipoContratoCap)) {
      addErr(
        HOJAS.empresas,
        f._fila,
        `Empresa ${identificacion}: tipoContratoCap no válido (juridica_empresa, juridica_oficial, juridica_ong, persona_natural)`,
      );
      continue;
    }
    const empresaCache = {
      identificacion: norm || identificacion,
      dv: str(f.dv),
      identificationDocumentCode: str(f.tipoDocumento) || '31',
      razonSocial,
      nombreComercial: str(f.nombreComercial),
      nombres,
      direccion: str(f.direccion),
      correo: str(f.correo).toLowerCase(),
      telefono: str(f.telefono),
      municipioNombre: str(f.municipio),
      tipoContratoCap,
    };
    empresasValidas.push({ _fila: f._fila, identificacion: norm || identificacion, doc: f });
    cacheEmpresasAnalisis.set(clave, empresaCache);
    if (identificacion !== clave) cacheEmpresasAnalisis.set(identificacion, empresaCache);
  }

  // numDocs presentes: en BD o en la hoja Alumnos del mismo archivo
  const numDocsArchivo = new Set();
  const alumnosValidos = [];
  const vistosAlumno = new Set();

  for (const f of datos.alumnos) {
    const numDoc = parseNumDoc(f.numDoc);
    if (numDoc == null) {
      addErr(HOJAS.alumnos, f._fila, `numDoc inválido: "${f.numDoc}" (${numDocInvalidMessage()})`);
      continue;
    }
    if (vistosAlumno.has(numDoc)) {
      addErr(HOJAS.alumnos, f._fila, `numDoc ${numDoc} repetido en el archivo`);
      continue;
    }
    vistosAlumno.add(numDoc);
    if (!str(f.nombre1) || !str(f.apellido1)) {
      addErr(HOJAS.alumnos, f._fila, `Alumno ${numDoc}: nombre1 y apellido1 son obligatorios`);
      continue;
    }
    const fechaNac = f.fechaNacimiento ? parseFecha(f.fechaNacimiento) : null;
    if (f.fechaNacimiento && !fechaNac) {
      addErr(HOJAS.alumnos, f._fila, `Alumno ${numDoc}: fechaNacimiento inválida ("${f.fechaNacimiento}")`);
    }
    numDocsArchivo.add(numDoc);
    alumnosValidos.push({ _fila: f._fila, numDoc, doc: f, fechaNac });
  }

  const existeAlumno = async (numDoc) => {
    if (numDocsArchivo.has(numDoc)) return true;
    const n = await DatosAlumno.countDocuments({ numDoc });
    return n > 0;
  };

  // Un programa es válido si ya existe en ARGO o si viene en la hoja Programas del archivo.
  const cacheExistePrograma = new Map();
  const existePrograma = async (codigo) => {
    const c = str(codigo);
    if (!c) return false;
    if (codigosProgramaArchivo.has(c.toLowerCase())) return true;
    if (cacheExistePrograma.has(c)) return cacheExistePrograma.get(c);
    const prog = await buscarPrograma(c);
    const ok = !!prog;
    cacheExistePrograma.set(c, ok);
    return ok;
  };

  const referidorCaches = { gestores: cacheGestoresAnalisis, empresas: cacheEmpresasAnalisis };

  const matriculasValidas = [];
  const refsMatriculaArchivo = new Set();
  const matriculasPorAlumno = new Map();
  for (const f of datos.matriculas) {
    const numDoc = parseNumDoc(f.numDoc);
    if (numDoc == null) {
      addErr(HOJAS.matriculas, f._fila, `numDoc inválido: "${f.numDoc}"`);
      continue;
    }
    if (!(await existeAlumno(numDoc))) {
      addErr(HOJAS.matriculas, f._fila, `Alumno ${numDoc} no existe (ni en ARGO ni en la hoja Alumnos)`);
      continue;
    }
    const codigoPrograma = str(f.codigoPrograma);
    if (!(await existePrograma(codigoPrograma))) {
      addErr(HOJAS.matriculas, f._fila, `Programa "${codigoPrograma}" no existe en ARGO ni en la hoja Programas`);
      continue;
    }
    const refMatricula = str(f.refMatricula);
    if (refMatricula) {
      if (refsMatriculaArchivo.has(refMatricula)) {
        addErr(HOJAS.matriculas, f._fila, `refMatricula "${refMatricula}" repetida en el archivo`);
        continue;
      }
      refsMatriculaArchivo.add(refMatricula);
    }
    const tarifa = parseTarifaMigracion(f.tarifa);
    const alumnoRef = await DatosAlumno.findOne({ numDoc }).lean();
    const referidor = await resolverReferidorMigracion(f, alumnoRef, tarifa, referidorCaches);
    if (referidor.error) {
      addErr(HOJAS.matriculas, f._fila, referidor.error);
      continue;
    }
    const valorTotal = parseValor(f.valorTotal) ?? 0;
    const valorPagado = parseValor(f.valorPagado) ?? 0;
    matriculasValidas.push({
      _fila: f._fila,
      numDoc,
      codigoPrograma,
      refMatricula,
      fechaMat: parseFecha(f.fechaMatricula) || new Date(),
      tarifa,
      referidor,
      valorTotal,
      valorPagado,
      estado: str(f.estado) || 'Activo',
      observaciones: str(f.observaciones),
    });
    matriculasPorAlumno.set(numDoc, (matriculasPorAlumno.get(numDoc) || 0) + 1);
  }

  const refsMatriculaValidas = new Set(
    matriculasValidas.map((m) => m.refMatricula).filter(Boolean),
  );

  const pagosValidos = [];
  for (const f of datos.pagos) {
    const numDoc = parseNumDoc(f.numDoc);
    if (numDoc == null) {
      addErr(HOJAS.pagos, f._fila, `numDoc inválido: "${f.numDoc}"`);
      continue;
    }
    if (!(await existeAlumno(numDoc))) {
      addErr(HOJAS.pagos, f._fila, `Alumno ${numDoc} no existe (ni en ARGO ni en la hoja Alumnos)`);
      continue;
    }
    const valor = parseValor(f.valor);
    if (valor == null || valor <= 0) {
      addErr(HOJAS.pagos, f._fila, `Pago de ${numDoc}: valor inválido ("${f.valor}")`);
      continue;
    }
    const codigoPrograma = str(f.codigoPrograma);
    const refMatricula = str(f.refMatricula);
    if (refMatricula && !refsMatriculaValidas.has(refMatricula)) {
      addErr(
        HOJAS.pagos,
        f._fila,
        `refMatricula "${refMatricula}" no corresponde a ninguna fila válida de la hoja Matriculas`,
      );
      continue;
    }
    if (codigoPrograma && !(await existePrograma(codigoPrograma))) {
      addErr(HOJAS.pagos, f._fila, `Programa "${codigoPrograma}" no existe en ARGO ni en la hoja Programas`);
      continue;
    }
    if (!codigoPrograma && !refMatricula) {
      const enArchivo = matriculasPorAlumno.get(numDoc) || 0;
      if (enArchivo > 1) {
        addErr(
          HOJAS.pagos,
          f._fila,
          `Alumno ${numDoc} tiene varias matrículas en el archivo: indique codigoPrograma o refMatricula`,
        );
        continue;
      }
      if (enArchivo === 0) {
        const matsDb = await Matricula.countDocuments({ numDoc });
        if (matsDb > 1) {
          addErr(
            HOJAS.pagos,
            f._fila,
            `Alumno ${numDoc} tiene varias matrículas en ARGO: indique codigoPrograma o refMatricula`,
          );
          continue;
        }
      }
    }
    if (codigoPrograma && !refMatricula) {
      const tieneMatArchivo = matriculasValidas.some(
        (m) => m.numDoc === numDoc && m.codigoPrograma === codigoPrograma,
      );
      if (!tieneMatArchivo) {
        const prog = await buscarPrograma(codigoPrograma);
        if (prog) {
          const idProg = idProgDe(prog);
          const tieneMatDb = await Matricula.countDocuments({ numDoc, idProg });
          if (!tieneMatDb) {
            addErr(
              HOJAS.pagos,
              f._fila,
              `No hay matrícula de ${numDoc} en el programa "${codigoPrograma}"`,
            );
            continue;
          }
        }
      }
    }
    pagosValidos.push({
      _fila: f._fila,
      numDoc,
      codigoPrograma,
      refMatricula,
      numeroRecibo: str(f.numeroRecibo),
      fecha: parseFecha(f.fecha) || new Date(),
      valor,
      formaPago: normalizarFormaPago(f.formaPago),
      concepto: str(f.concepto),
      observaciones: str(f.observaciones),
    });
  }

  const certificadosValidos = [];
  for (const f of datos.certificados) {
    const numDoc = parseNumDoc(f.numDoc);
    if (numDoc == null) {
      addErr(HOJAS.certificados, f._fila, `numDoc inválido: "${f.numDoc}"`);
      continue;
    }
    const codigoPrograma = str(f.codigoPrograma);
    const progEnArgo = codigoPrograma ? await existePrograma(codigoPrograma) : false;
    /** Sin programa en ARGO, código vacío o modo histórico → certificado independiente (idProg HISTORICO). */
    const historico =
      opts.certificadosHistoricos || !codigoPrograma || (codigoPrograma && !progEnArgo);
    if (!historico && !(await existeAlumno(numDoc))) {
      addErr(HOJAS.certificados, f._fila, `Alumno ${numDoc} no existe (ni en ARGO ni en la hoja Alumnos)`);
      continue;
    }
    const fechaEmision = parseFecha(f.fechaEmision);
    if (!fechaEmision) {
      addErr(HOJAS.certificados, f._fila, `Certificado de ${numDoc}: fechaEmision obligatoria o inválida`);
      continue;
    }
    const encabezado = str(f.nombreCurso);
    const nombreTitular = str(f.nombreTitular);
    if (historico && !encabezado && !nombreTitular && !str(f.codigoCertificado) && !str(f.codVerificacion)) {
      addErr(
        HOJAS.certificados,
        f._fila,
        `Certificado de ${numDoc}: indique nombreCurso, nombreTitular, codVerificacion o codigoCertificado`,
      );
      continue;
    }
    if (!historico && !codigoPrograma) {
      addErr(
        HOJAS.certificados,
        f._fila,
        'codigoPrograma es obligatorio cuando el certificado debe ligarse a un programa de ARGO',
      );
      continue;
    }
    if (!historico && codigoPrograma && !progEnArgo) {
      addErr(
        HOJAS.certificados,
        f._fila,
        `Programa "${codigoPrograma}" no existe en ARGO ni en la hoja Programas`,
      );
      continue;
    }
    const horasRaw = str(f.horas);
    const horasCert = horasRaw !== '' && Number.isFinite(Number(horasRaw)) ? Number(horasRaw) : null;
    const estado = str(f.estado).toLowerCase() === 'anulado' ? 'anulado' : 'vigente';
    certificadosValidos.push({
      _fila: f._fila,
      numDoc,
      codigoPrograma: progEnArgo ? codigoPrograma : null,
      codigoProgramaOrigen: codigoPrograma || null,
      codigoCert: str(f.codigoCertificado),
      codVerificacion: str(f.codVerificacion),
      encabezado,
      nombreTitular,
      horasCert,
      fechaEmision,
      fechaVencimiento: parseFecha(f.fechaVencimiento),
      numActa: str(f.numActa),
      numFolio: str(f.numFolio),
      numRunt: str(f.numRunt),
      estado,
      historico,
    });
  }

  return {
    hojas: hojasSel,
    opcionesIntegridad: opts,
    ignoradas,
    errores,
    indice,
    totales: {
      programas: datos.programas.length,
      gestores: datos.gestores.length,
      empresas: datos.empresas.length,
      alumnos: datos.alumnos.length,
      matriculas: datos.matriculas.length,
      pagos: datos.pagos.length,
      certificados: datos.certificados.length,
    },
    validos: {
      programas: programasValidos,
      gestores: gestoresValidos,
      empresas: empresasValidas,
      alumnos: alumnosValidos,
      matriculas: matriculasValidas,
      pagos: pagosValidos,
      certificados: certificadosValidos,
    },
  };
}

function idProgDe(prog) {
  return String(prog.idPrograma ?? prog._id);
}

function toDec(n) {
  return mongoose.Types.Decimal128.fromString(String(Math.round(Number(n) || 0)));
}

function numDesdeCodigo(codigo) {
  const m = String(codigo || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Ajusta consecutivos para que los próximos números no choquen con los migrados. */
async function sincronizarConsecutivos() {
  const certs = await Certificado.find({ codigoCert: { $exists: true, $ne: '' } })
    .select('codigoCert')
    .lean();
  const maxCert = certs.reduce((m, c) => Math.max(m, numDesdeCodigo(c.codigoCert)), 0);
  await Config.updateOne(
    { clave: CLAVE_CERT, consecutivoCertificado: { $lt: maxCert } },
    { $set: { consecutivoCertificado: maxCert } },
  );

  const cfgRecibo = await Config.findOne({ clave: CLAVE_RECIBO }).lean();
  if (cfgRecibo) {
    const pref = String(cfgRecibo.prefijoComprobanteIngreso || 'CI').trim();
    const recibos = await Ingreso.find({ numRecibo: new RegExp(`^${pref}-\\d+$`) })
      .select('numRecibo')
      .lean();
    const maxRec = recibos.reduce((m, r) => Math.max(m, numDesdeCodigo(r.numRecibo)), 0);
    await Config.updateOne(
      { clave: CLAVE_RECIBO, consecutivoComprobanteIngreso: { $lt: maxRec } },
      { $set: { consecutivoComprobanteIngreso: maxRec } },
    );
  }
}

/**
 * Importa el archivo. opciones:
 * - hojas: qué migrar (['alumnos','certificados']…); vacío = todo.
 * - actualizarExistentes: si un alumno ya existe, actualiza sus datos (default false: se omite).
 * - idSede: sede asignada a matrículas y pagos migrados.
 */
async function importarArchivo(
  buffer,
  {
    usuario = 'sistema',
    nombreArchivo = '',
    idSede = null,
    actualizarExistentes = false,
    hojas,
    certificadosHistoricos,
    modoIntegridad,
  } = {},
) {
  const analisis = await analizarArchivo(buffer, hojas, { certificadosHistoricos, modoIntegridad });
  const totalFilas =
    analisis.validos.programas.length
    + analisis.validos.gestores.length
    + analisis.validos.empresas.length
    + analisis.validos.alumnos.length
    + analisis.validos.matriculas.length
    + analisis.validos.pagos.length
    + analisis.validos.certificados.length;

  progreso.iniciar('migracion', 'Validación completada, importando…');
  progreso.definirTotal(totalFilas);

  try {
  const lote = `MIG-${Date.now()}`;
  const marca = { migrado: true, loteMigracion: lote };
  const sede = String(idSede || '').trim() || 'PRINCIPAL';

  const resultado = {
    lote,
    hojas: analisis.hojas,
    programas: { creados: 0, omitidos: 0 },
    gestores: { creados: 0, omitidos: 0 },
    empresas: { creadas: 0, omitidas: 0 },
    alumnos: { creados: 0, actualizados: 0, omitidos: 0 },
    matriculas: { creadas: 0, omitidas: 0 },
    pagos: { creados: 0, omitidos: 0 },
    certificados: { creados: 0, omitidos: 0 },
    filasConError: analisis.errores.length,
  };

  // Cache de programas (por código) que comparten matrículas y certificados.
  const cacheProg = new Map();
  const resolverProg = async (codigo) => {
    const c = str(codigo);
    if (cacheProg.has(c)) return cacheProg.get(c);
    const prog = await buscarPrograma(c);
    cacheProg.set(c, prog);
    return prog;
  };
  /** idServ del servicio de matrícula principal del programa (para ligar la liquidación). */
  const idServPrincipal = async (prog) => {
    try {
      const servs = await listarServiciosMatricula(prog);
      return servs[0]?.idServ != null ? String(servs[0].idServ) : null;
    } catch {
      return null;
    }
  };

  const cacheReferidor = { gestores: new Map(), empresas: new Map() };

  // 0) Programas (+ servicios con tarifas). Deben crearse antes que matrículas y certificados.
  progreso.fase('Programas', { total: totalFilas, reiniciarHecho: false });
  for (const p of analisis.validos.programas) {
    const existente = await buscarPrograma(p.codigo);
    if (existente) {
      cacheProg.set(p.codigo, existente);
      resultado.programas.omitidos += 1;
      progreso.avanzar(1);
      continue;
    }
    const prog = await crearProgramaConServicio(p.doc, analisis.indice, usuario);
    cacheProg.set(p.codigo, prog);
    resultado.programas.creados += 1;
    progreso.avanzar(1);
  }

  // 0b) Gestores (catálogo comercial)
  progreso.fase('Gestores', { reiniciarHecho: false });
  for (const g of analisis.validos.gestores) {
    const existente = await Gestor.findOne({ numero: g.numero }).lean();
    if (existente) {
      resultado.gestores.omitidos += 1;
      progreso.avanzar(1);
      continue;
    }
    await Gestor.create({
      numero: g.numero,
      tipoDoc: str(g.doc.tipoDoc) || 'CC',
      nombres: str(g.doc.nombres),
      apellidos: str(g.doc.apellidos),
      seudonimo: str(g.doc.seudonimo),
      correo: str(g.doc.correo).toLowerCase(),
      celular: str(g.doc.celular),
      direccion: str(g.doc.direccion),
      activo: true,
      userAddReg: usuario,
      migrado: true,
      ...marca,
    });
    resultado.gestores.creados += 1;
    progreso.avanzar(1);
  }

  // 0c) Empresas / clientes (catálogo comercial — tarifa 6)
  progreso.fase('Empresas', { reiniciarHecho: false });
  for (const e of analisis.validos.empresas) {
    const idNorm = e.identificacion;
    const existente = await resolverEmpresaReferidor(idNorm, cacheReferidor.empresas);
    if (existente?._id) {
      cacheReferidor.empresas.set(idNorm, existente);
      const rawId = str(e.doc.identificacion);
      if (rawId) cacheReferidor.empresas.set(rawId, existente);
      resultado.empresas.omitidas += 1;
      progreso.avanzar(1);
      continue;
    }
    const f = e.doc;
    const razonSocial = str(f.razonSocial);
    const nombres = str(f.nombres);
    const tipoContratoCap = str(f.tipoContratoCap);
    const legalOrganizationCode =
      tipoContratoCap === 'persona_natural' ? '2' : str(f.legalOrganizationCode) || '1';
    const doc = await Cliente.create({
      identificationDocumentCode: str(f.tipoDocumento) || '31',
      identificacion: idNorm,
      dv: str(f.dv),
      legalOrganizationCode,
      razonSocial,
      nombreComercial: str(f.nombreComercial),
      nombres,
      tributeCode: 'ZZ',
      responsabilidadFiscal: 'R-99-PN',
      direccion: str(f.direccion),
      correo: str(f.correo).toLowerCase(),
      telefono: str(f.telefono),
      municipioNombre: str(f.municipio),
      tipoContratoCap,
      activo: true,
      userAddReg: usuario,
      migrado: true,
      ...marca,
    });
    cacheReferidor.empresas.set(idNorm, doc.toObject ? doc.toObject() : doc);
    const rawId = str(f.identificacion);
    if (rawId && rawId !== idNorm) {
      cacheReferidor.empresas.set(rawId, cacheReferidor.empresas.get(idNorm));
    }
    resultado.empresas.creadas += 1;
    progreso.avanzar(1);
  }

  // 1) Alumnos
  progreso.fase('Alumnos', { reiniciarHecho: false });
  for (const a of analisis.validos.alumnos) {
    const f = a.doc;
    const existente = await DatosAlumno.findOne({ numDoc: a.numDoc }).select('_id').lean();
    let refExtra = {};
    if (parseSiNo(f.manejoGestorEmpresa)) {
      const tipoRef = normalizarTipoReferidor(f.tipoReferidor);
      const tarifaRef = tipoRef === 'empresa' ? TARIFA_EMPRESA : TARIFA_GESTOR;
      const referidorAlumno = await resolverReferidorMigracion(f, null, tarifaRef, cacheReferidor);
      if (!referidorAlumno.error) {
        refExtra = alumnoReferidorPayload(referidorAlumno);
      }
    }
    const payload = {
      tipoDoc: str(f.tipoDoc) || 'CC',
      nombre1: str(f.nombre1).toUpperCase(),
      nombre2: str(f.nombre2).toUpperCase(),
      apellido1: str(f.apellido1).toUpperCase(),
      apellido2: str(f.apellido2).toUpperCase(),
      fechaNac: a.fechaNac || undefined,
      genero: str(f.genero),
      celular: str(f.celular),
      correo: str(f.correo).toLowerCase(),
      direccion: str(f.direccion),
      munOrigen: str(f.municipio),
      observaciones: str(f.observaciones),
      userAddReg: usuario,
      ...marca,
      ...refExtra,
    };
    if (existente) {
      if (actualizarExistentes) {
        await DatosAlumno.updateOne({ _id: existente._id }, { $set: { ...payload, fechaMod: new Date() } });
        resultado.alumnos.actualizados += 1;
      } else {
        resultado.alumnos.omitidos += 1;
      }
      progreso.avanzar(1);
      continue;
    }
    await DatosAlumno.create({ numDoc: a.numDoc, ...payload });
    resultado.alumnos.creados += 1;
    progreso.avanzar(1);
  }

  // 2) Matrículas (+ liquidación con el saldo pendiente, ligada a programa y servicio)
  progreso.fase('Matrículas', { reiniciarHecho: false });
  for (const m of analisis.validos.matriculas) {
    const prog = await resolverProg(m.codigoPrograma);
    if (!prog) {
      resultado.matriculas.omitidas += 1;
      progreso.avanzar(1);
      continue;
    }
    const idProg = idProgDe(prog);
    let ya = 0;
    if (m.refMatricula) {
      ya = await Matricula.countDocuments({ refMigracion: m.refMatricula });
    } else {
      ya = await Matricula.countDocuments({ numDoc: m.numDoc, idProg });
    }
    if (ya > 0) {
      resultado.matriculas.omitidas += 1;
      progreso.avanzar(1);
      continue;
    }
    const saldo = Math.max(0, m.valorTotal - m.valorPagado);
    let pagada = 'No Pago';
    if (m.valorTotal > 0 && saldo <= 0) pagada = 'Pagado';
    else if (m.valorPagado > 0) pagada = 'Pago Parcial';

    const alumnoMat = await DatosAlumno.findOne({ numDoc: m.numDoc }).lean();
    const refPayload = alumnoReferidorPayload(m.referidor);
    const alumnoSnap = {
      ...alumnoMat,
      ...refPayload,
      tipoReferidorComercial: refPayload.tipoReferidorComercial || alumnoMat?.tipoReferidorComercial,
    };
    const referidorSnap = snapshotReferidorComercial(alumnoSnap, m.tarifa);

    const mat = await Matricula.create({
      numDoc: m.numDoc,
      idSede: sede,
      idPrograma: idProg,
      idProg,
      fechaMat: m.fechaMat,
      valorMat: toDec(m.valorTotal),
      tarifa: m.tarifa,
      pagada,
      estado: m.estado,
      observaciones: m.observaciones,
      ...(m.refMatricula ? { refMigracion: m.refMatricula } : {}),
      ...referidorSnap,
      ...marca,
    });

    if (m.valorTotal > 0) {
      await Liquidacion.create({
        numDoc: m.numDoc,
        idSede: sede,
        idMat: mat._id,
        idMatricula: mat._id,
        idProg,
        idServ: await idServPrincipal(prog),
        descripcion: `${prog.nombreProg || prog.descripcion || 'Programa'} (migrado)`,
        valor: toDec(m.valorTotal),
        abonado: toDec(m.valorPagado),
        saldo: toDec(saldo),
        estado: saldo <= 0 ? 'pagado' : m.valorPagado > 0 ? 'parcial' : 'pendiente',
        fechaCreacion: m.fechaMat,
        ...marca,
      });
    }
    resultado.matriculas.creadas += 1;
    progreso.avanzar(1);
  }

  // 3) Pagos históricos
  progreso.fase('Pagos históricos', { reiniciarHecho: false });
  let secuenciaPago = 0;
  for (const p of analisis.validos.pagos) {
    const numRecibo = p.numeroRecibo || `${lote}-${String((secuenciaPago += 1)).padStart(4, '0')}`;
    const ya = await Ingreso.countDocuments({ numDoc: p.numDoc, numRecibo });
    if (ya > 0) {
      resultado.pagos.omitidos += 1;
      progreso.avanzar(1);
      continue;
    }
    const ing = await Ingreso.create({
      numDoc: p.numDoc,
      valor: toDec(p.valor),
      numRecibo,
      idTipoPago: 'MIGRACION',
      tipoIngreso: 'MIGRACION',
      idTipoIngreso: 'MIGRACION',
      concepto: p.concepto || 'Pago migrado del sistema anterior',
      fecha: p.fecha,
      formaPago: p.formaPago,
      observaciones: p.observaciones,
      ingresoCaja: false,
      idSede: sede,
      userAddReg: usuario,
      origenMigracion: true,
      ...marca,
    });
    await vincularPagoMigradoALiquidaciones(ing._id, {
      codigoPrograma: p.codigoPrograma || undefined,
      refMatricula: p.refMatricula || undefined,
    });
    resultado.pagos.creados += 1;
    progreso.avanzar(1);
  }

  // 4) Certificados (históricos o ligados a programa existente en ARGO)
  progreso.fase('Certificados', { reiniciarHecho: false });
  for (const c of analisis.validos.certificados) {
    let idProg = ID_PROG_HISTORICO;
    let nombreProg = '';
    if (c.codigoPrograma) {
      const prog = await resolverProg(c.codigoPrograma);
      if (prog) {
        idProg = idProgDe(prog);
        nombreProg = prog.nombreProg || '';
      }
    }
    const esHistorico = c.historico === true || idProg === ID_PROG_HISTORICO;
    if (c.codVerificacion) {
      const yaVer = await Certificado.countDocuments({ codVerificacion: c.codVerificacion });
      if (yaVer > 0) {
        resultado.certificados.omitidos += 1;
        progreso.avanzar(1);
        continue;
      }
    }
    if (c.codigoCert) {
      const ya = await Certificado.countDocuments({ codigoCert: c.codigoCert });
      if (ya > 0) {
        resultado.certificados.omitidos += 1;
        progreso.avanzar(1);
        continue;
      }
    }
    let certReferidor = {};
    const matComercial = await Matricula.findOne({
      numDoc: c.numDoc,
      idProg,
      referidorComercial: true,
    })
      .sort({ fechaMat: -1 })
      .lean();
    if (matComercial) {
      certReferidor = snapshotReferidorDesdeMatricula(matComercial);
    }
    await Certificado.create({
      numDoc: c.numDoc,
      idProg,
      codigoCert: c.codigoCert || undefined,
      codVerificacion: c.codVerificacion || undefined,
      encabezado: c.encabezado || nombreProg || c.codigoCert || '',
      nombreTitular: c.nombreTitular || undefined,
      horasCert: c.horasCert != null ? String(c.horasCert) : undefined,
      fechaEmision: c.fechaEmision,
      fechaVencimiento: c.fechaVencimiento || undefined,
      numActa: c.numActa || undefined,
      numFolio: c.numFolio || undefined,
      numRunt: c.numRunt || undefined,
      estado: c.estado,
      migracionHistorica: esHistorico,
      codigoProgramaOrigen: c.codigoProgramaOrigen || undefined,
      ...certReferidor,
      ...marca,
    });
    resultado.certificados.creados += 1;
    progreso.avanzar(1);
  }

  progreso.fase('Finalizando', { reiniciarHecho: false });
  await sincronizarConsecutivos();
  const { aplicarParchesReferidorComercial } = require('./migrarReferidorComercial');
  await aplicarParchesReferidorComercial().catch(() => {});

  await MigracionLote.create({
    lote,
    fecha: new Date(),
    usuario,
    archivo: nombreArchivo,
    hojas: analisis.hojas,
    resultado,
    errores: analisis.errores.slice(0, 200),
  });

  progreso.finalizar('ok', `Importación ${lote} completada`);
  return { ...resultado, ignoradas: analisis.ignoradas, errores: analisis.errores };
  } catch (e) {
    progreso.finalizar('error', e.message || 'Error en la importación');
    throw e;
  }
}

async function listarLotes() {
  return MigracionLote.find({}).sort({ fecha: -1 }).limit(50).lean();
}

module.exports = {
  generarPlantilla,
  analizarArchivo,
  importarArchivo,
  listarLotes,
  crearProgramaConServicio,
  normalizarOpcionesIntegridad,
  HOJAS,
};
