/** Biblioteca PDF del curso SERVIAL — rutas en /documents/mercancias-peligrosas/ */





const DOC = (file) => `/documents/mercancias-peligrosas/${file}`;

const MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS = [
  {
    id: 'normativa',
    kicker: 'Normativa y marco legal',
    titulo: 'Normativa y marco legal',
    lead: 'Disposiciones legales y técnicas que rigen el transporte de mercancías peligrosas en Colombia.',
    documentos: [
      {
        titulo: 'Decreto 1496 de 2018',
        descripcion:
          'Reglamenta el transporte terrestre automotor de carga por carretera y establece obligaciones para conductores, empresas y operadores logísticos.',
        archivoUrl: DOC('decreto-1496-de-2018.pdf'),
        meta: 'PDF · 594 KB',
      },
      {
        titulo: 'Resolución 1223 de 2014',
        descripcion:
          'Adopta el Sistema Globalmente Armonizado (SGA) en Colombia y define criterios de clasificación, etiquetado y fichas de seguridad.',
        archivoUrl: DOC('resolucion-no-1223-de-2014-1.pdf'),
        meta: 'PDF · 292 KB',
      },
      {
        titulo: 'Código Nacional de Tránsito',
        descripcion:
          'Ley 769 de 2002. Marco del tránsito terrestre: licencias, infracciones, documentación del vehículo y deberes del conductor.',
        archivoUrl: DOC('codigo-nacional-de-transito.pdf'),
        meta: 'PDF · 3.2 MB',
      },
      {
        titulo: 'Acuerdo europeo UNECE (transporte internacional)',
        descripcion:
          'Referencia del Acuerdo europeo sobre transporte internacional de mercancías peligrosas por carretera (ADR) y armonización internacional.',
        archivoUrl: DOC('unece.pdf'),
        meta: 'PDF · 9.1 MB',
      },
    ],
  },
];

module.exports = { MERCANCIAS_PELIGROSAS_DOCUMENTOS_GRUPOS };
