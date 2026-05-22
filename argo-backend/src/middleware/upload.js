const fs = require('fs');
const path = require('path');
const multer = require('multer');

const BASE = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function build(subdir) {
  const dest = path.join(BASE, subdir);
  ensureDir(dest);
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
      const name = `${Date.now()}_${Math.round(Math.random() * 1e6)}_${safe}`;
      cb(null, name);
    },
  });
  return multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
}

module.exports = {
  alumnos: build('alumnos'),
  vehiculos: build('vehiculos'),
  inspecciones: build('inspecciones'),
  certificados: build('certificados'),
  publicUrl(subdir, filename) {
    return `${subdir}/${filename}`;
  },
};
