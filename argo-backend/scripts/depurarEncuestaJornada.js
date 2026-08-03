require('dotenv').config();
const mongoose = require('mongoose');
const DatosAlumno = require('../src/models/DatosAlumno');
const Certificado = require('../src/models/Certificado');
const EncuestaJornadaCap = require('../src/models/EncuestaJornadaCap');
const { parseNumDoc, numDocQuery } = require('../src/utils/numDoc');
const { carpasAsistidasAlumnoContrato } = require('../src/services/carpasAsistidasContrato');
const { encuestasPendientesPortal } = require('../src/services/encuestasJornadaCap');

const docArg = process.argv[2] || '1040044473';

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/argo');
  const numDoc = parseNumDoc(docArg);
  const da = await DatosAlumno.findOne(numDocQuery(numDoc)).lean();
  console.log('ALUMNO:', {
    numDoc: da?.numDoc,
    tipoAlumno: da?.tipoAlumno,
    nombre: [da?.nombre1, da?.apellido1].filter(Boolean).join(' '),
  });

  const certs = await Certificado.find({ numDoc }).lean();
  console.log(`\nCERTIFICADOS (${certs.length}):`);
  for (const c of certs) {
    console.log({
      codigoCert: c.codigoCert,
      tipoCertificado: c.tipoCertificado,
      idContrato: c.idContrato,
      idProg: c.idProg,
      estado: c.estado,
      idJornada: c.idJornada,
    });
  }

  const encuestas = await EncuestaJornadaCap.find({}).lean();
  console.log(`\nENCUESTAS (${encuestas.length}):`);
  for (const e of encuestas) {
    console.log({
      _id: e._id,
      idContrato: e.idContrato,
      titulo: e.titulo,
      estado: e.estado,
      fechaApertura: e.fechaApertura,
      fechaCierre: e.fechaCierre,
    });
  }

  const contratoIds = [
    ...new Set([
      ...certs.filter((c) => c.idContrato).map((c) => String(c.idContrato)),
      ...encuestas.map((e) => String(e.idContrato)),
    ]),
  ];
  for (const idC of contratoIds) {
    const carpas = await carpasAsistidasAlumnoContrato(numDoc, idC);
    console.log(`\nCONTRATO ${idC}`);
    console.log('  carpas asistidas:', carpas);
  }

  try {
    const res = await encuestasPendientesPortal(docArg);
    console.log('\nPENDIENTES PORTAL:', JSON.stringify(res, null, 2));
  } catch (e) {
    console.log('\nERROR PORTAL:', e.status, e.message);
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
