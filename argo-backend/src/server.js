require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { logCorsOnStartup } = require('./config/cors');
const { getLanIpv4 } = require('./utils/networkHosts');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
  try {
    await connectDB();
    const { initConfigNomina } = require('./services/configNomina');
    await initConfigNomina();
    const { repararUsuariosNumeroNulo } = require('./services/empleadoUsuario');
    repararUsuariosNumeroNulo().catch((err) =>
      console.warn('[ARGO] reparar usuarios numero:', err.message),
    );
    const { sincronizarDefaultsTipoEgreso } = require('./services/tipoEgresoNomina');
    sincronizarDefaultsTipoEgreso()
      .then((n) => {
        if (n > 0) console.log(`[ARGO] Tipos de egreso: ${n} registro(s) con defaults de nómina`);
      })
      .catch((err) => console.warn('[ARGO] sync tipoEgreso:', err.message));

    const server = app.listen(PORT, HOST, () => {
      console.log('');
      logCorsOnStartup();
      console.log('[ARGO] API en ejecución');
      console.log(`  Local:    http://localhost:${PORT}`);
      const lan = getLanIpv4();
      if (lan.length) {
        console.log('  Red (LAN):');
        for (const { name, address } of lan) {
          console.log(`    http://${address}:${PORT}  (${name})`);
        }
      } else {
        console.log('  Red (LAN): no se detectó IPv4 — use ipconfig para ver su IP');
      }
      console.log('');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error('');
        console.error(`[ARGO] El puerto ${PORT} ya está en uso.`);
        console.error('  Suele pasar si ya hay otro "pnpm run dev" abierto.');
        console.error('  En PowerShell:  netstat -ano | findstr :3000');
        console.error('  Luego:          taskkill /PID <numero> /F');
        console.error('  O cierre la otra terminal del backend.');
        console.error('');
        process.exit(1);
      }
      console.error('[ARGO] Error en el servidor HTTP:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[ARGO] Error iniciando servidor:', err);
    process.exit(1);
  }
})();
