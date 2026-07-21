export type RootStackParamList = {
  Login: undefined;
  Denied: undefined;
  Home: undefined;
  JornadasHoy: undefined;
  /** Admin: listar / editar jornadas de cualquier fecha. */
  JornadasGestion: undefined;
  CrearJornada: { idContrato?: string };
  InformesJornadas: undefined;
  ClasesJornada: { jornadaId: string; jornadaLabel: string; idContrato: string };
  ClaseDetalle: {
    claseId: string;
    jornadaLabel: string;
    idContrato: string;
    /** Prefill documento tras crear alumno. */
    prefillNumDoc?: string;
  };
  EditarJornada: { jornadaId: string };
  CrearAlumnoJornada: {
    numDoc?: string;
    claseId?: string;
    jornadaLabel?: string;
    idContrato?: string;
    codContrato?: string;
    fechaJornada?: string;
  };
  Certificados: { idContrato?: string; contratoLabel?: string };
  CertificadoHtml: { id: string; titulo: string };
  CambiarPassword: undefined;
};
