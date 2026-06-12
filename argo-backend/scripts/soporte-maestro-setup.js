/**
 * Genera las credenciales de la cuenta de soporte maestro (break-glass).
 *
 * Uso:
 *   node scripts/soporte-maestro-setup.js                 (genera contraseña aleatoria)
 *   node scripts/soporte-maestro-setup.js "MiClaveSegura" (usa la contraseña dada)
 *   node scripts/soporte-maestro-setup.js --user soporte-argo "MiClave"
 *   node scripts/soporte-maestro-setup.js --user soporte "MiClave" --env .env
 *
 * Produce (todo en la terminal, sin crear archivos): un QR para escanear en
 * Google Authenticator, el secreto TOTP, el hash bcrypt de la contraseña y el
 * bloque .env listo para pegar en el servidor.
 *
 * Con --env <ruta>, escribe/actualiza las líneas SOPORTE_MASTER_* directamente
 * en ese archivo .env (recomendado: evita errores al copiar el secreto a mano).
 *
 * IMPORTANTE: ejecútelo en el servidor, escanee el QR en Google Authenticator.
 * No guarde la contraseña en texto plano en ningún archivo del repositorio.
 */
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { generateSecret, generateURI } = require('otplib');
const QRCode = require('qrcode');

function parseArgs(argv) {
  const out = { user: 'soporte-argo', password: null, env: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--user') {
      out.user = argv[++i] || out.user;
    } else if (argv[i] === '--env') {
      out.env = argv[++i] || '.env';
    } else if (!out.password) {
      out.password = argv[i];
    }
  }
  return out;
}

/** Escribe/actualiza las líneas SOPORTE_MASTER_* en el archivo .env indicado. */
function actualizarEnv(rutaEnv, valores) {
  let contenido = '';
  try {
    contenido = fs.readFileSync(rutaEnv, 'utf8');
  } catch {
    contenido = '';
  }
  let lineas = contenido.split(/\r?\n/);
  const claves = Object.keys(valores);
  lineas = lineas.filter((l) => !claves.some((k) => l.trim().startsWith(`${k}=`)));
  while (lineas.length && lineas[lineas.length - 1].trim() === '') lineas.pop();
  for (const k of claves) lineas.push(`${k}=${valores[k]}`);
  fs.writeFileSync(rutaEnv, lineas.join('\n') + '\n', 'utf8');
}

function passwordAleatoria() {
  // 18 caracteres legibles, sin ambigüedades.
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#%+=';
  let p = '';
  const bytes = crypto.randomBytes(18);
  for (let i = 0; i < 18; i++) p += alfabeto[bytes[i] % alfabeto.length];
  return p;
}

async function main() {
  const { user, password: passArg, env: envPath } = parseArgs(process.argv.slice(2));
  const password = passArg || passwordAleatoria();
  const generada = !passArg;

  const issuer = process.env.MFA_TOTP_ISSUER || 'ARGO Finstruvial';
  const secret = generateSecret();
  const uri = generateURI({ issuer, label: `${issuer}:${user}`, secret });
  const hash = await bcrypt.hash(password, 12);

  // QR directamente en la terminal (no genera archivos).
  const qrTerminal = await QRCode.toString(uri, { type: 'terminal', small: true });

  const linea = (s) => console.log(s);
  linea('\n======================================================================');
  linea(' CUENTA DE SOPORTE MAESTRO (break-glass) — credenciales generadas');
  linea('======================================================================\n');
  linea('Escanee este QR con Google Authenticator:\n');
  linea(qrTerminal);
  linea(`Usuario:      ${user}`);
  linea(`Contraseña:   ${password}${generada ? '   (generada al azar — guárdela en su gestor de contraseñas)' : ''}`);
  linea(`Secreto TOTP: ${secret}   (por si prefiere ingresarlo a mano en el Authenticator)`);

  const valoresEnv = {
    SOPORTE_MASTER_ENABLED: 'true',
    SOPORTE_MASTER_USER: user,
    SOPORTE_MASTER_PASSWORD_HASH: hash,
    SOPORTE_MASTER_TOTP_SECRET: secret,
  };

  if (envPath) {
    actualizarEnv(envPath, valoresEnv);
    linea(`\n✓ Variables SOPORTE_MASTER_* escritas en ${envPath} (sin errores de copiado).`);
    linea('\nPasos:');
    linea(' 1. Escanee el QR de arriba en Google Authenticator (o use el Secreto TOTP a mano).');
    linea(' 2. Reinicie el backend para que tome el .env (docker compose restart argo-backend, o reinicie pnpm dev).');
    linea(' 3. Guarde la contraseña en su gestor de contraseñas y borre esta salida.');
    linea(' 4. Para deshabilitar el acceso: SOPORTE_MASTER_ENABLED=false (o quite las variables).');
  } else {
    linea('\n--- Pegue este bloque en el .env del servidor -----------------------\n');
    for (const [k, v] of Object.entries(valoresEnv)) linea(`${k}=${v}`);
    linea('\n---------------------------------------------------------------------');
    linea('Pasos:');
    linea(' 1. Escanee el QR de arriba en Google Authenticator (o use el Secreto TOTP a mano).');
    linea(' 2. Copie el bloque COMPLETO y péguelo en el .env (el secreto tiene 32 caracteres).');
    linea('    Sugerencia: vuelva a correr con  --env .env  para que se escriba solo, sin copiar.');
    linea(' 3. Reinicie el backend (docker compose restart argo-backend).');
    linea(' 4. Guarde la contraseña en su gestor de contraseñas y borre esta salida.');
    linea(' 5. Para deshabilitar el acceso: SOPORTE_MASTER_ENABLED=false (o quite las variables).');
  }
  linea('======================================================================\n');
}

main().catch((e) => {
  console.error('Error generando credenciales:', e.message);
  process.exit(1);
});
