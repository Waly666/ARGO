import type { AlumnoCrearDto, AlumnoDetalleItem } from '../api/domain';
import { TIPO_ALUMNO_DEFAULT } from './alumnoCatalogo';
import { aMayusculas, mayusculasNombre } from './format';

function fechaAString(v?: string | Date | null): string {
  if (!v) return '';
  if (typeof v === 'string') {
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return v.slice(0, 10);
  }
  if (!Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  return '';
}

export function alumnoDetalleToForm(a: AlumnoDetalleItem): {
  form: AlumnoCrearDto;
  expedidaTexto: string;
  munOrigenTexto: string;
  deptoOrigenTexto: string;
  empresaNombre: string;
} {
  const freq = a.alertaPagoFrecuencia;
  const codDep = String(a.codDepartamento || '')
    .replace(/\D/g, '')
    .padStart(2, '0')
    .replace(/^00$/, '');
  return {
    form: {
      tipoAlumno: a.tipoAlumno || TIPO_ALUMNO_DEFAULT,
      tipoDoc: a.tipoDoc || '1',
      numDoc: a.numDoc != null ? String(a.numDoc).replace(/\D/g, '') : '',
      expedida: aMayusculas(a.expedida || ''),
      apellido1: mayusculasNombre(a.apellido1 || ''),
      apellido2: mayusculasNombre(a.apellido2 || '') || undefined,
      nombre1: mayusculasNombre(a.nombre1 || ''),
      nombre2: mayusculasNombre(a.nombre2 || '') || undefined,
      fechaNac: fechaAString(a.fechaNac),
      observaciones: aMayusculas(a.observaciones || ''),
      genero: a.genero || '',
      tipoSangre: a.tipoSangre || '',
      jornada: a.jornada || '',
      estadoCivil: a.estadoCivil || '',
      estrato: a.estrato || '',
      regimenSalud: a.regimenSalud || '',
      nivelFormacion: a.nivelFormacion || '',
      ocupacion: a.ocupacion || '',
      discapacidad: a.discapacidad || '9',
      munOrigen: a.munOrigen || a.codMunicipio || '',
      codMunicipio: a.codMunicipio || a.munOrigen || '',
      codDepartamento: codDep,
      nombreDepartamento: aMayusculas(a.nombreDepartamento || ''),
      nombreMunicipio: aMayusculas(a.nombreMunicipio || ''),
      correo: aMayusculas(a.correo || ''),
      direccion: aMayusculas(a.direccion || ''),
      celular: a.celular || '',
      multiCulturalidad: a.multiCulturalidad || 'NO_APLICA',
      empresaId: a.empresaId ?? null,
      alertaPagoFrecuencia: freq === 'mensual' || freq === 'quincenal' ? freq : '',
      alertaPago: fechaAString(a.alertaPago),
    },
    expedidaTexto: aMayusculas(a.expedida?.trim() || ''),
    munOrigenTexto: aMayusculas(a.nombreMunicipio || a.munOrigenLabel || a.munOrigen || a.codMunicipio || ''),
    deptoOrigenTexto: aMayusculas(a.nombreDepartamento || ''),
    empresaNombre: aMayusculas(a.empresaNombre?.trim() || ''),
  };
}
