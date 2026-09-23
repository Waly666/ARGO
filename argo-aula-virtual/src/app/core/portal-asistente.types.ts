import { PortalPaginaKey } from './portal-site';

export interface PortalAsistentePaginaConfig {
  activo: boolean;
  texto: string;
}

export interface PortalAsistenteConfig {
  videoUrl: string;
  videoUrlAbsoluta?: string;
  paginas: Record<PortalPaginaKey, PortalAsistentePaginaConfig>;
}

/** Formato que consume el componente flotante del asistente. */
export interface PortalAsistenteViewConfig {
  asistenteActivo: boolean;
  asistenteTexto: string;
  asistenteVideoUrl: string;
  asistenteVideoUrlAbsoluta?: string;
}

export type LegacyConsultaAsistente = {
  asistenteActivo?: boolean;
  asistenteTexto?: string;
  asistenteVideoUrl?: string;
  asistenteVideoUrlAbsoluta?: string;
};

export const PORTAL_AULA_ASISTENTE_TEXTO_DEFAULT = `Bienvenido al aula virtual.

Soy tu guía en pantalla. Puedes arrastrarme a un lado que no estorbe y hacer clic cuando quieras que te lea este mensaje en voz alta. Doble clic pausa o reanuda la lectura.

En el menú de la izquierda encontrará:
• Tablero: resumen de su avance.
• Mis cursos: cursos virtuales, clases y evaluaciones en línea.
• Presenciales: grupos, materiales y calendario de clases en sede.
• Puntajes: resultados de sus evaluaciones.
• Certificados: descargue sus certificados cuando estén disponibles.
• Mi perfil: revise sus datos de contacto.
• Foro: participa en el foro del curso que tenga abierto.

Para estudiar un curso virtual, entre en Mis cursos, elija el curso y abra la clase. Use el botón de menú en el celular si no ve la barra lateral.

Si tiene dudas, use el foro del curso o los canales de contacto de su centro de formación.`;

export const PORTAL_CONSULTA_ASISTENTE_TEXTO_DEFAULT = `🚘 FORMACIÓN QUE ABRE CAMINOS Y GENERA CONFIANZA

En nuestro Centro de Enseñanza Automovilística, trabajamos con el compromiso de brindar una formación integral, responsable y de alta calidad.

Contamos con los requisitos y reconocimientos correspondientes ante las entidades competentes, incluyendo el sector de Transporte y Educación, además de certificaciones de calidad que respaldan nuestros procesos de formación.

🎓 Ofrecemos cursos orientados a la formación y actualización de conductores, con programas que buscan responder a las necesidades del sector empresarial y laboral.

⛽ Formación con enfoque empresarial: contamos con cursos y procesos de capacitación válidos para los requisitos aplicables en procesos relacionados con ECOPETROL, de acuerdo con las condiciones y exigencias correspondientes.

Nuestro propósito es formar conductores responsables, competentes y preparados para asumir los retos de la movilidad y del sector productivo.

📚 Capacítate con una institución que trabaja por tu seguridad, tu formación y tu futuro.

Centro de Enseñanza Automovilística
✅ Formación
✅ Calidad
✅ Seguridad vial
✅ Capacitación para el sector empresarial
✅ Cursos y certificaciones conforme a la normativa aplicable`;
