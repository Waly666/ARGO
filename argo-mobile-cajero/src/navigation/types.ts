export type RootStackParamList = {
  Bootstrap: undefined;
  Login: undefined;
  Home: undefined;
  Caja: undefined;
  CajaCobros: undefined;
  CajaMovimientos: undefined;
  Alumnos: undefined;
  AlumnoDetalle: { numDoc: string; nombre: string; alumnoId?: string };
  DocumentoViewer: { title: string; htmlPath: string };
  Certificados: undefined;
  Facturacion: undefined;
  Programas: undefined;
  Servicios: undefined;
  Ajustes: undefined;
};
