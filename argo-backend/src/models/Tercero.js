const mongoose = require('mongoose');

/**
 * Catálogo de terceros para flujo de caja (ingresos/egresos sin alumno).
 * Misma base de datos de identidad/contacto que clientes de facturación,
 * sin campos fiscales de FE (retenciones, tipo contrato cap).
 */
const TerceroSchema = new mongoose.Schema(
  {
    identificationDocumentCode: { type: String, trim: true, default: '13' },
    identificacion: { type: String, required: true, trim: true, index: true },
    dv: { type: String, trim: true, default: '' },
    /** 1=Persona jurídica, 2=Persona natural. */
    legalOrganizationCode: { type: String, trim: true, default: '2' },
    razonSocial: { type: String, trim: true, default: '' },
    nombreComercial: { type: String, trim: true, default: '' },
    nombres: { type: String, trim: true, default: '' },
    tributeCode: { type: String, trim: true, default: 'ZZ' },
    responsabilidadFiscal: { type: String, trim: true, default: 'R-99-PN' },
    direccion: { type: String, trim: true, default: '' },
    correo: { type: String, trim: true, default: '', lowercase: true },
    telefono: { type: String, trim: true, default: '' },
    municipioCodigo: { type: String, trim: true, default: '' },
    municipioNombre: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true, index: true },
    userAddReg: { type: String, trim: true },
    userChangeRecord: { type: String, trim: true },
  },
  { collection: 'tercerosCaja', timestamps: true, strict: false },
);

TerceroSchema.index({ razonSocial: 'text', nombres: 'text', identificacion: 'text' });

module.exports = mongoose.model('Tercero', TerceroSchema);
