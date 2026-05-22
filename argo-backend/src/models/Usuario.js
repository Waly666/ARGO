const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    nickName: { type: String, trim: true },
    nombres:  { type: String, trim: true },
    apellidos:{ type: String, trim: true },
    email:    { type: String, trim: true, lowercase: true },
    rol:      { type: String, trim: true, default: 'usuario' },
    activo:   { type: Boolean, default: true },
    passwordHash: { type: String, required: true },
  },
  { collection: 'usuarios', timestamps: true, strict: false },
);

UsuarioSchema.methods.compararPassword = function (plain) {
  return bcrypt.compare(plain || '', this.passwordHash || '');
};

UsuarioSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(String(plain ?? ''), 10);
};

UsuarioSchema.set('toJSON', {
  virtuals: false,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
