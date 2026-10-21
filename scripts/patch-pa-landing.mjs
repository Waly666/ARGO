import fs from 'fs';

const landingPatch = {
  kicker: 'Capacitación en emergencias · Villavicencio · Meta · Colombia',
  titulo: 'Primeros Auxilios',
  tituloLinea2: 'Prepárate para actuar',
  subtitulo: 'Curso virtual y presencial para personas, trabajadores y empresas',
  h1: 'Curso de Primeros Auxilios Virtual y Presencial',
  heroLead:
    'Aprende a reconocer una emergencia, actuar oportunamente y brindar una atención inicial segura mientras llega la ayuda especializada. Capacitación dirigida a personas, trabajadores, conductores, empresas, instituciones, brigadistas y comunidad en Villavicencio, Meta, Llanos Orientales y toda Colombia.',
  ctaInscribirseTexto: 'Inscríbete al curso',
  ctaEmpresaTexto: 'Capacitación para empresas',
  ctaWhatsappTexto: 'Hablar por WhatsApp',
  ctaInicioTexto: 'Ver curso de primeros auxilios',
  ctaUrl: '/curso-primeros-auxilios',
  confianzaTitulo: 'Prepárate para actuar cuando cada minuto cuenta',
  confianzaTexto:
    'Una emergencia puede presentarse en el trabajo, en la carretera, en el hogar o en cualquier espacio de la vida cotidiana. Los primeros auxilios permiten realizar una atención inicial mientras se activa y llega el sistema profesional de emergencias.',
  queEsTitulo: '¿Qué son los Primeros Auxilios?',
  queEsTexto:
    'Los primeros auxilios comprenden las acciones iniciales que pueden realizarse ante una enfermedad repentina, lesión o emergencia mientras se solicita o llega la atención profesional. La formación no pretende reemplazar al personal médico: enseña a identificar riesgos, valorar la situación, activar emergencias y acompañar a la persona afectada.',
  cicloPasos: ['Reconocer', 'Proteger', 'Alertar', 'Asistir'],
  cicloFrase: 'Primeros Auxilios = actuación inicial segura mientras llega la ayuda especializada',
  fraseAprendizaje: 'No se trata de reemplazar al médico. Se trata de saber qué hacer mientras llega la ayuda.',
  modalidadesTitulo: 'Elige cómo realizar tu Curso de Primeros Auxilios',
  regionalTitulo: 'Curso de Primeros Auxilios en Villavicencio, Meta y los Llanos Orientales',
  empresasTitulo: 'Curso de Primeros Auxilios para Empresas',
  empresasCtaTitulo: '¿Necesitas capacitar a tu equipo?',
  empresasCtaBoton: 'Solicitar cotización empresarial',
  pesvTitulo: 'Fortalece la preparación de tu organización ante emergencias',
  pesvLead:
    'El curso puede complementar programas de Seguridad y Salud en el Trabajo, brigadas, prevención de riesgos y seguridad vial empresarial.',
  metodologiaTitulo: 'Aprender Primeros Auxilios significa aprender a tomar decisiones',
  audienciaTitulo: '¿Quién puede realizar el Curso de Primeros Auxilios?',
  beneficiosTitulo: '¿Por qué aprender Primeros Auxilios?',
  certificacionTitulo: 'Certificación del Curso de Primeros Auxilios',
  faqTitulo: 'Preguntas frecuentes sobre el Curso de Primeros Auxilios',
  ctaFinalTitulo: 'Una emergencia puede ocurrir en cualquier momento',
  ctaFinalLead: 'Estar preparado puede cambiar la forma en que respondes.',
  ctaFinalTexto: 'Realiza nuestro Curso de Primeros Auxilios Virtual o Presencial.',
  ctaFinalFrase: 'Prepárate para actuar. Aprende para proteger.',
  footerSeoLine: 'Curso de Primeros Auxilios | Capacitación empresarial | Villavicencio Meta | Aula virtual',
};

const jsonPath = 'argo-backend/src/constants/primeros-auxilios-landing.json';
const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
Object.assign(json, landingPatch);
fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
console.log('JSON updated');
