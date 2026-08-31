/** Biblioteca PDF — rutas en /documents/trabajo-en-alturas/ */

export interface TaDocumento {
  titulo: string;
  descripcion: string;
  archivoUrl: string;
  meta?: string;
}

export interface TaDocumentoGrupo {
  id: string;
  kicker: string;
  titulo: string;
  lead: string;
  documentos: TaDocumento[];
}

const DOC = (file: string) => `/documents/trabajo-en-alturas/${file}`;

export const TRABAJO_EN_ALTURAS_DOCUMENTOS_GRUPOS: TaDocumentoGrupo[] = [
  {
    id: 'manual',
    kicker: 'Manual del curso',
    titulo: 'Manual Trabajo Seguro en Alturas 2026',
    lead: 'Versión impresa del curso: 20 módulos del manual CEA SERVIAL COLOMBIA para consulta offline.',
    documentos: [
      {
        titulo: 'Manual Trabajo Seguro en Alturas 2026',
        descripcion:
          'Contenido completo del programa de formación para Trabajador Autorizado en el sector transportador.',
        archivoUrl: DOC('manual-trabajo-seguro-en-alturas-2026.pdf'),
        meta: 'PDF · manual 2026',
      },
    ],
  },
  {
    id: 'normativa',
    kicker: 'Marco legal',
    titulo: 'Normativa de apoyo',
    lead: 'Disposiciones legales que rigen el trabajo seguro en alturas en Colombia.',
    documentos: [
      {
        titulo: 'Resolución 4272 de 2021',
        descripcion:
          'Reglamenta el trabajo seguro en alturas: requisitos, certificación, altura mínima de 2,0 m y vigencia de 3 años.',
        archivoUrl: DOC('resolucion-4272-2021-trabajo-alturas.pdf'),
        meta: 'PDF · normativa principal',
      },
      {
        titulo: 'Ley 1562 de 2012',
        descripcion: 'Sistema General de Riesgos Laborales (SGRL) y obligaciones en seguridad y salud en el trabajo.',
        archivoUrl: DOC('ley-1562-2012.pdf'),
        meta: 'PDF · SGRL',
      },
    ],
  },
];
