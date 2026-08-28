/** Debe coincidir con argo-backend/src/constants/autorizacionTratamientoDatos.js */
export const AUTORIZACION_DATOS_VERSION = '2026-03-cea';

export const AUTORIZACION_DATOS_TITULO =
  'Autorización de tratamiento de información Ley 1581 de 2012';

export function buildAutorizacionDatosTexto(
  nombreEmpresa?: string | null,
  correo?: string | null,
): string {
  const empresa = (nombreEmpresa || '').trim() || 'la entidad';
  const email = (correo || '').trim() || 'el correo institucional de la entidad';
  return `En aras de dar cumplimiento con lo contemplado en la Ley 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales, la autorización suministrada en el presente formulario faculta a ${empresa} para que recopile, almacene, use y suprima los datos personales aquí suministrados, especialmente, aquellos que son definidos como Datos Sensibles (*).

${empresa} para cumplir con su objetivo de prestar un servicio de alta calidad y ajustarse a las normas del derecho de Habeas Data, requiere realizar el "Tratamiento de Datos" antes señalado, de forma tal que la finalidad y uso que la Entidad llevará a cabo la información suministrada, será netamente administrativa e informativa. Bajo ninguna circunstancia se realizará Tratamiento de Datos personales con fines comerciales o circulación. En todo caso aplicarán las excepciones de ley.

En virtud del artículo 8 de la Ley 1581 de 2012, el titular de la información personal que es recopilada en este formulario, tiene los siguientes derechos:

1. Conocer, actualizar, rectificar y suprimir los datos personales suministrados.

2. Conocer los usos que se han hecho de la información suministrada, cuando así lo solicite el titular.

3. Revocar la autorización y/o solicitar la supresión del dato suministrado cuando en el tratamiento realizado no se respeten los principios, derechos y garantías constitucionales y legales a favor del titular.

4. Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.

El titular de la información suministrada, podrá ejercer cualquiera de los derechos mencionados, dirigiendo una petición en este sentido a la dirección electrónica; ${email}

(*) Datos Sensibles: Aquellos que afectan la intimidad del Titular o cuyo uso indebido puede generar su discriminación.

Autorizada la solicitud en los términos dispuestos por ${empresa}, se le dará trámite al requerimiento según lo establecido por la ley.`;
}

export function payloadAutorizacionDatos(aceptado: boolean) {
  return {
    autorizacionDatos: aceptado,
    autorizacionDatosVersion: AUTORIZACION_DATOS_VERSION,
  };
}
