require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[ARGO] API escuchando en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[ARGO] Error iniciando servidor:', err);
    process.exit(1);
  }
})();
