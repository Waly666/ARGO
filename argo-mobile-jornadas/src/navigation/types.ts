export type RootStackParamList = {
  Login: undefined;
  Denied: undefined;
  Home: undefined;
  JornadasHoy: undefined;
  ClasesJornada: { jornadaId: string; jornadaLabel: string; idContrato: string };
  ClaseDetalle: { claseId: string; jornadaLabel: string; idContrato: string };
  Certificados: { idContrato?: string; contratoLabel?: string };
  CertificadoHtml: { id: string; titulo: string };
};
