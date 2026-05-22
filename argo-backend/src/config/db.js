const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/argo';
  // Catálogos usan esquema flexible (sin campos declarados); strictQuery true
  // eliminaría filtros como nombreMunicipio en búsquedas divipola.
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri);
  console.log(`[ARGO] MongoDB conectado: ${mongoose.connection.host} / ${mongoose.connection.name}`);
}

module.exports = { connectDB };
