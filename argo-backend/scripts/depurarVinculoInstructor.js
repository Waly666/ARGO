/**
 * Diagnóstico vínculo usuario ↔ empleado ↔ instructor (jornadas).
 * Útil cuando en VPS aparece otro instructor al operar clases.
 *
 * Uso (local o VPS):
 *   node scripts/depurarVinculoInstructor.js [username]
 *
 * VPS:
 *   docker compose exec argo-backend node scripts/depurarVinculoInstructor.js waly666
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Usuario = require('../src/models/Usuario');
const Empleado = require('../src/models/Empleado');
const ClaseJornadaCap = require('../src/models/ClaseJornadaCap');
const Cargo = require('../src/models/Cargo');
const {
  empleadoPorUsuarioId,
  nombreEmpleado,
} = require('../src/services/instructorJornada');

const usernameArg = (process.argv[2] || 'admin').trim().toLowerCase();

function nombreEmp(emp) {
  return nombreEmpleado(emp) || '—';
}

async function cargoNombre(cargoId) {
  if (!cargoId) return '';
  const c = await Cargo.findOne({ idCargo: cargoId }).lean();
  return String(c?.nombre || '').trim();
}

(async () => {
  try {
    await connectDB();
    const u = await Usuario.findOne({ username: usernameArg }).lean();
    if (!u) {
      console.error(`Usuario «${usernameArg}» no encontrado.`);
      process.exit(1);
    }

    const uid = String(u._id);
    console.log('\n=== USUARIO ===');
    console.log({
      _id: uid,
      username: u.username,
      nombres: u.nombres,
      apellidos: u.apellidos,
      rol: u.rol,
      idEmpleado: u.idEmpleado ?? null,
    });

    const porIdUsuario = await Empleado.findOne({ idUsuario: u._id }).lean();
    const porIdUsuarioStr = await Empleado.findOne({ idUsuario: uid }).lean();
    const porCampoUsuario = porIdUsuario || porIdUsuarioStr;

    let porIdEmpleadoCampo = null;
    if (u.idEmpleado != null && Number.isFinite(Number(u.idEmpleado))) {
      porIdEmpleadoCampo = await Empleado.findOne({ idEmpleado: Number(u.idEmpleado) }).lean();
    }

    console.log('\n=== EMPLEADO por Empleado.idUsuario (vínculo correcto) ===');
    if (porCampoUsuario) {
      console.log({
        idEmpleado: porCampoUsuario.idEmpleado,
        nombre: nombreEmp(porCampoUsuario),
        idUsuario: String(porCampoUsuario.idUsuario || ''),
        cargo: await cargoNombre(porCampoUsuario.cargoId),
      });
    } else {
      console.log('(ninguno)');
    }

    console.log('\n=== EMPLEADO por Usuario.idEmpleado (puede ser ajeno) ===');
    if (porIdEmpleadoCampo) {
      const empUid = porIdEmpleadoCampo.idUsuario
        ? String(porIdEmpleadoCampo.idUsuario).trim()
        : '';
      const bidireccional = empUid === uid;
      console.log({
        idEmpleado: porIdEmpleadoCampo.idEmpleado,
        nombre: nombreEmp(porIdEmpleadoCampo),
        idUsuarioEnEmpleado: empUid || '(vacío)',
        bidireccionalOk: bidireccional,
        problema:
          !bidireccional && u.idEmpleado
            ? 'Usuario.idEmpleado apunta aquí pero Empleado.idUsuario NO coincide → instructor equivocado'
            : null,
      });
    } else {
      console.log('(ninguno o idEmpleado vacío en usuario)');
    }

    const resuelto = await empleadoPorUsuarioId(u._id);
    console.log('\n=== RESUELVE empleadoPorUsuarioId (lo que usa ARGO hoy) ===');
    if (resuelto) {
      console.log({
        idEmpleado: resuelto.idEmpleado,
        nombre: nombreEmp(resuelto),
        idUsuario: String(resuelto.idUsuario || ''),
      });
    } else {
      console.log('null → admin sin empleado; al operar clase libre debería quedar su username');
    }

    const clases = await ClaseJornadaCap.find({
      $or: [
        { idUsuarioInstructor: uid },
        ...(resuelto?.idEmpleado != null
          ? [{ idEmpleadoInstructor: resuelto.idEmpleado }]
          : []),
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    console.log(`\n=== ÚLTIMAS CLASES vinculadas (${clases.length}) ===`);
    for (const c of clases) {
      let nombreInstructor = c.idinstructor || '—';
      if (c.idEmpleadoInstructor != null) {
        const emp = await Empleado.findOne({ idEmpleado: c.idEmpleadoInstructor }).lean();
        if (emp) nombreInstructor = nombreEmp(emp);
      }
      const tuClase =
        String(c.idUsuarioInstructor || '') === uid ||
        (resuelto && Number(c.idEmpleadoInstructor) === Number(resuelto.idEmpleado));
      console.log({
        _id: String(c._id),
        estado: c.estado,
        idEmpleadoInstructor: c.idEmpleadoInstructor ?? null,
        idUsuarioInstructor: c.idUsuarioInstructor || '',
        instructorMostrado: nombreInstructor,
        idinstructorGuardado: c.idinstructor || '',
        coincideContigo: tuClase,
      });
    }

    console.log('\n=== RECOMENDACIÓN ===');
    if (
      porIdEmpleadoCampo &&
      String(porIdEmpleadoCampo.idUsuario || '').trim() !== uid &&
      u.idEmpleado
    ) {
      console.log(
        '1. En VPS: Configuración → Usuarios → quitar idEmpleado del login, O',
      );
      console.log(
        '   RRHH → Empleado correcto → campo Usuario ARGO = este login.',
      );
      console.log(
        '2. Desplegar fix instructorJornada.js (git pull + rebuild argo-backend).',
      );
      console.log(
        '3. Clases ya guardadas con instructor incorrecto: editarlas en Jornadas → Clases.',
      );
    } else if (!resuelto) {
      console.log(
        'Sin empleado vinculado: normal para admin puro. Tras desplegar el fix, al iniciar clase libre verá su username.',
      );
    } else {
      console.log('Vínculo usuario ↔ empleado parece coherente. Revise si la clase tenía otro instructor asignado al crearla.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
