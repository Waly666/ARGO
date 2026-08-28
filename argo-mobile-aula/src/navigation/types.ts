import type { PanelAula } from '../api/types';

export type RootStackParamList = {
  Bootstrap: undefined;
  Welcome: undefined;
  Login: undefined;
  Registro: undefined;
  Catalogo: undefined;
  CursoDetalle: { id: string; titulo?: string };
  ConsultaCertificados: undefined;
  AulaHub: { panel?: PanelAula } | undefined;
  AulaCursos: undefined;
  AulaMisCursos: undefined;
  AulaPresenciales: undefined;
  AulaPuntajes: undefined;
  AulaCertificados: undefined;
  AulaForo: undefined;
  AulaPerfil: undefined;
  CoursePlayer: { idPrograma: string; titulo: string; playerUrl: string; storagePrefix?: string };
  EvaluacionCohorte: { idEval: string; idCohorte: string; titulo: string };
  DocumentoHtml: { title: string; htmlPath: string };
  PagoCheckout: { url: string; titulo?: string; idPrograma: string };
  ForoCurso: { idPrograma: string; nombreProg: string };
};

/** @deprecated Tabs eliminados — usar pantallas de stack Aula*. */
export type AulaTabParamList = {
  Tablero: undefined;
  Cursos: undefined;
  MisCursos: undefined;
  Presenciales: undefined;
  Puntajes: undefined;
  Certificados: undefined;
  Foro: undefined;
  Perfil: undefined;
};
