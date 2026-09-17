/**
 * Diagnóstico: ¿por qué un programa no admite subir paquete virtual?
 * Uso: node scripts/diagnostico-programa-virtual.js 11
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { buscarPrograma, listarServiciosMatricula } = require('../src/services/programaServicio');
const {
  resolverModalidadPrograma,
  programaAdmiteMatriculaVirtual,
} = require('../src/services/programaModalidad');

const id = process.argv[2];
if (!id) {
  console.error('Uso: node scripts/diagnostico-programa-virtual.js <idPrograma>');
  process.exit(1);
}

function num(v) {
  if (v == null || v === '') return 0;
  return Number(v) || 0;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const prog = await buscarPrograma(id);
  if (!prog) {
    console.error(`Programa ${id} NO encontrado en Mongo.`);
    process.exit(1);
  }
  const servicios = await listarServiciosMatricula(prog);
  const info = resolverModalidadPrograma(prog, servicios);
  const ok = programaAdmiteMatriculaVirtual(prog, servicios);

  console.log('--- Programa ---');
  console.log('idPrograma:', prog.idPrograma ?? prog.idProg);
  console.log('nombre:', prog.nombreProg || prog.nomCert);
  console.log('modalidades (raw):', prog.modalidades);
  console.log('modalidades efectivas:', info.modalidades);
  console.log('tarifaVirtual (programa):', num(prog.tarifaVirtual));
  console.log('admiteVirtual:', info.admiteVirtual);
  console.log('');
  console.log('--- Servicios de matrícula ---');
  if (!servicios.length) {
    console.log('(ninguno vinculado — revise idProg en catálogo de servicios)');
  }
  for (const s of servicios) {
    console.log(
      `- idServ ${s.idServ} | ${s.descrServicio || s.descripcion || '(sin nombre)'}`,
    );
    console.log(
      `  tarifa1=${num(s.tarifa1)} tarifaVirtual=${num(s.tarifaVirtual)} idProg=${s.idProg}`,
    );
  }
  console.log('');
  console.log('--- Resultado ---');
  console.log('programaAdmiteMatriculaVirtual:', ok ? 'SÍ ✓' : 'NO ✗');
  if (!ok) {
    if (!info.admiteVirtual) {
      console.log('→ Falta modalidad Virtual en el programa (edite y marque Virtual o Mixta).');
    } else if (!servicios.some((s) => num(s.tarifaVirtual) > 0)) {
      console.log('→ Hay modalidad virtual pero ningún servicio con tarifaVirtual > 0.');
      console.log('  En ERP: Programas → editar → Tarifa virtual (4) > 0 → Guardar.');
    }
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
