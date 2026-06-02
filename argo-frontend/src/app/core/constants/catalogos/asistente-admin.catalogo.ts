import type { AsistenteContexto } from '../asistente.types';

export const ASISTENTE_ADMIN: Record<string, AsistenteContexto> = {
  'programas.admin': {
    id: 'programas.admin',
    modulo: 'programas',
    saludo: 'Administración de programas académicos.',
    tips: [
      {
        id: 'prog-1',
        titulo: 'Programa vs servicio',
        cuerpo:
          'Programa = paquete (varios servicios en orden). Servicio = ítem individual en catálogo. Matricular programa crea varias liquidaciones.',
      },
      {
        id: 'prog-2',
        titulo: 'Tarifas',
        cuerpo:
          'Tarifa 1/2/3 según política comercial. Cambios no alteran liquidaciones ya creadas.',
      },
      {
        id: 'prog-3',
        titulo: 'Servicios incluidos',
        cuerpo:
          'Defina qué ítems componen el programa. Alumno ve desglose en pestaña Servicios.',
      },
      {
        id: 'prog-4',
        titulo: 'Sede y vigencia',
        cuerpo:
          'Programas pueden ser exclusivos de sede o temporada. Desactivar impide nuevas matrículas.',
      },
      {
        id: 'prog-5',
        titulo: 'Clases incluidas',
        cuerpo:
          'Algunos programas vinculan módulos CEA automáticos. Verifique coherencia con Programación.',
      },
    ],
  },
  'servicios.admin': {
    id: 'servicios.admin',
    modulo: 'servicios',
    saludo: 'Catálogo maestro de servicios del CEA.',
    tips: [
      {
        id: 'srv-1',
        titulo: 'Código idServ',
        cuerpo:
          'Identificador interno. Referenciado en liquidaciones, facturación y reportes. No cambie en servicios con historial.',
      },
      {
        id: 'srv-2',
        titulo: 'Descripción',
        cuerpo:
          'Texto en recibos, certificados y línea de factura electrónica.',
      },
      {
        id: 'srv-3',
        titulo: 'Tarifas 1 / 2 / 3',
        cuerpo:
          'Precios alternos (convenio, promoción, sede). Matrícula elige tarifa según contexto.',
      },
      {
        id: 'srv-4',
        titulo: 'IVA %',
        cuerpo:
          'Porcentaje legal del servicio gravado. 0% si exento/excluido.',
      },
      {
        id: 'srv-5',
        titulo: 'Condición de IVA',
        cuerpo:
          'Gravado = desglosa IVA. Exento = tarifa 0% formal. Excluido = sin IVA en factura. Coherente con régimen del CEA.',
      },
      {
        id: 'srv-6',
        titulo: 'Facturar',
        cuerpo:
          'SI = puede incluirse en factura electrónica. NO = solo recibo de pago.',
      },
      {
        id: 'srv-7',
        titulo: 'Auditoría',
        cuerpo:
          'Fechas y usuario de alta/modificación al pie del formulario.',
      },
    ],
  },
  'vehiculos.lista': {
    id: 'vehiculos.lista',
    modulo: 'vehiculos',
    saludo: 'Flota de vehículos del CEA.',
    tips: [
      {
        id: 'veh-l-1',
        titulo: 'Placa',
        cuerpo:
          'Identificador principal. Única en flota. Búsqueda rápida por placa.',
      },
      {
        id: 'veh-l-2',
        titulo: 'Alertas documentales',
        cuerpo:
          'SOAT, tecnomecánica, contractual, inspección. Filas parpadean si vencido o por vencer.',
      },
      {
        id: 'veh-l-3',
        titulo: 'Estado operativo',
        cuerpo:
          'Disponible, en mantenimiento, en práctica. No asigne práctica a vehículo no disponible.',
      },
      {
        id: 'veh-l-4',
        titulo: 'Clase de vehículo',
        cuerpo:
          'Debe coincidir con categorías de licencia que enseña el CEA (motocicleta, automóvil…).',
      },
      {
        id: 'veh-l-5',
        titulo: 'Nuevo vehículo',
        cuerpo:
          'Complete documentos desde el inicio para evitar alertas el primer día de práctica.',
      },
    ],
  },
  'vehiculos.detalle': {
    id: 'vehiculos.detalle',
    modulo: 'vehiculos',
    saludo: 'Ficha del vehículo — datos y documentos.',
    tips: [
      {
        id: 'veh-d-1',
        titulo: 'Datos técnicos',
        cuerpo:
          'Marca, línea, modelo, combustible. Informativos para inspección y hoja de vida.',
      },
      {
        id: 'veh-d-2',
        titulo: 'Vencimientos',
        cuerpo:
          'Fechas SOAT, tecnomecánica, póliza. ARGO calcula días restantes y alertas.',
      },
      {
        id: 'veh-d-3',
        titulo: 'Inspección preoperacional',
        cuerpo:
          'Formato configurable. Consecutivo diario antes de salir a vía. Historial en pestaña inspecciones.',
      },
      {
        id: 'veh-d-4',
        titulo: 'Prácticas asignadas',
        cuerpo:
          'Vea calendario CEA que usa este vehículo. Conflicto de horario lo resuelve programación.',
      },
    ],
  },
  'rrhh.hub': {
    id: 'rrhh.hub',
    modulo: 'rrhh',
    saludo: 'Recursos humanos — menú principal.',
    tips: [
      {
        id: 'rrhh-h-1',
        titulo: 'Empleados',
        cuerpo:
          'Ficha laboral: cargo, EPS, contrato, documentos. Base para nómina e instructores.',
      },
      {
        id: 'rrhh-h-2',
        titulo: 'Contratos',
        cuerpo:
          'Vinculación legal y fechas. Contrato vencido afecta nómina.',
      },
      {
        id: 'rrhh-h-3',
        titulo: 'Nómina y novedades',
        cuerpo:
          'Cálculo de pagos y horas/incapacidades. Parámetros en Configuración → Nómina.',
      },
      {
        id: 'rrhh-h-4',
        titulo: 'Catálogos RRHH',
        cuerpo:
          'Cargos, EPS, AFP, ARL, departamentos. Datos maestros para formularios.',
      },
    ],
  },
  'rrhh.empleados': {
    id: 'rrhh.empleados',
    modulo: 'rrhh',
    saludo: 'Gestión de empleados.',
    tips: [
      {
        id: 'rrhh-e-1',
        titulo: 'Documento y nombre',
        cuerpo:
          'Identificación única. Coincide con soporte de contrato y nómina.',
      },
      {
        id: 'rrhh-e-2',
        titulo: 'Cargo y departamento',
        cuerpo:
          'Catálogos RRHH. Instructor suele tener cargo específico + permisos en ARGO.',
      },
      {
        id: 'rrhh-e-3',
        titulo: 'Seguridad social',
        cuerpo:
          'EPS, AFP, ARL, caja compensación. Requerido para nómina legal.',
      },
      {
        id: 'rrhh-e-4',
        titulo: 'Usuario ARGO',
        cuerpo:
          'Cuenta de login se crea aparte en Configuración → Usuarios y se vincula al empleado.',
      },
      {
        id: 'rrhh-e-5',
        titulo: 'Documentos empleado',
        cuerpo:
          'Licencias, exámenes médicos. Vencimientos generan alertas en encabezado.',
      },
    ],
  },
  'rrhh.contratos': {
    id: 'rrhh.contratos',
    modulo: 'rrhh',
    saludo: 'Contratos laborales.',
    tips: [
      {
        id: 'rrhh-c-1',
        titulo: 'Tipo contrato',
        cuerpo:
          'Término fijo, indefinido, prestación servicios. Afecta liquidación final.',
      },
      {
        id: 'rrhh-c-2',
        titulo: 'Fechas',
        cuerpo:
          'Inicio obligatorio. Fin en contratos a término. Alertas antes de vencimiento.',
      },
      {
        id: 'rrhh-c-3',
        titulo: 'Salario / honorarios',
        cuerpo:
          'Base para nómina. Cambios registrados como novedad.',
      },
    ],
  },
  'rrhh.nomina': {
    id: 'rrhh.nomina',
    modulo: 'rrhh',
    saludo: 'Liquidación de nómina.',
    tips: [
      {
        id: 'rrhh-n-1',
        titulo: 'Período',
        cuerpo:
          'Seleccione mes/quincena según configuración. No calcule dos veces mismo período cerrado.',
      },
      {
        id: 'rrhh-n-2',
        titulo: 'Novedades',
        cuerpo:
          'Horas extra, incapacidades, deducciones se ingresan en Novedades antes del cálculo.',
      },
      {
        id: 'rrhh-n-3',
        titulo: 'Parámetros',
        cuerpo:
          'Porcentajes legales en Configuración → Nómina. Revise anualmente.',
      },
    ],
  },
  'rrhh.novedades': {
    id: 'rrhh.novedades',
    modulo: 'rrhh',
    saludo: 'Novedades de nómina (horas, deducciones, incapacidades).',
    tips: [
      {
        id: 'rrhh-nov-1',
        titulo: 'Antes de liquidar',
        cuerpo:
          'Toda novedad del período debe estar registrada antes de correr nómina.',
      },
      {
        id: 'rrhh-nov-2',
        titulo: 'Empleado y concepto',
        cuerpo:
          'Seleccione empleado activo con contrato vigente. Concepto define si suma o resta.',
      },
    ],
  },
  'config.usuarios': {
    id: 'config.usuarios',
    modulo: 'config',
    saludo: 'Usuarios y acceso al sistema.',
    tips: [
      {
        id: 'cfg-u-1',
        titulo: 'Login',
        cuerpo:
          'Usuario único. Contraseña con política de seguridad del CEA.',
      },
      {
        id: 'cfg-u-2',
        titulo: 'Rol',
        cuerpo:
          'Define permisos (cajero, recepción, admin…). Un usuario = un rol principal.',
      },
      {
        id: 'cfg-u-3',
        titulo: 'Empleado vinculado',
        cuerpo:
          'Opcional. Trae sede y datos para portal instructor.',
      },
      {
        id: 'cfg-u-4',
        titulo: 'Activo / inactivo',
        cuerpo:
          'Desactivar bloquea login sin borrar historial de auditoría.',
      },
    ],
  },
  'config.sedes': {
    id: 'config.sedes',
    modulo: 'config',
    saludo: 'Sedes del CEA (multi-sede).',
    tips: [
      {
        id: 'cfg-s-1',
        titulo: 'Datos sede',
        cuerpo:
          'Nombre, dirección, NIT si difiere. Afecta encabezado de recibos.',
      },
      {
        id: 'cfg-s-2',
        titulo: 'Numeración',
        cuerpo:
          'Consecutivos recibos/certificados pueden ser por sede.',
      },
      {
        id: 'cfg-s-3',
        titulo: 'Usuarios',
        cuerpo:
          'Usuario con sede principal solo ve datos de su sede (según permiso).',
      },
    ],
  },
  'config.roles': {
    id: 'config.roles',
    modulo: 'config',
    saludo: 'Roles y permisos granulares.',
    tips: [
      {
        id: 'cfg-r-1',
        titulo: 'Permiso por pantalla',
        cuerpo:
          'Ej: alumnos.gestionar, caja.turno, facturacion. Sin permiso → Sin acceso.',
      },
      {
        id: 'cfg-r-2',
        titulo: 'Principio mínimo privilegio',
        cuerpo:
          'Cajero: caja + cobros. Recepción: alumnos + matrículas. Admin: config.',
      },
      {
        id: 'cfg-r-3',
        titulo: 'Cambios en caliente',
        cuerpo:
          'Usuario debe cerrar sesión y entrar de nuevo para aplicar permisos nuevos.',
      },
    ],
  },
  'config.recibos': {
    id: 'config.recibos',
    modulo: 'config',
    saludo: 'Plantilla de recibos de caja.',
    tips: [
      {
        id: 'cfg-rec-1',
        titulo: 'Encabezado',
        cuerpo:
          'Logo, NIT, razón social, resolución DIAN si aplica a recibos.',
      },
      {
        id: 'cfg-rec-2',
        titulo: 'Prefijos CI / CE',
        cuerpo:
          'Comprobante ingreso vs egreso. Consecutivo automático al registrar movimiento.',
      },
      {
        id: 'cfg-rec-3',
        titulo: 'QR recibo',
        cuerpo:
          'Opcional en comprobante para verificación interna.',
      },
    ],
  },
  'config.certificados': {
    id: 'config.certificados',
    modulo: 'config',
    saludo: 'Diseño de certificados por tipo.',
    tips: [
      {
        id: 'cfg-cert-1',
        titulo: 'Tipos',
        cuerpo:
          'Cada certificado académico (asistencia, aprobación…) tiene layout propio.',
      },
      {
        id: 'cfg-cert-2',
        titulo: 'Editor layout',
        cuerpo:
          'Arrastre campos dinámicos (nombre alumno, fecha, consecutivo). Preview antes de guardar.',
      },
      {
        id: 'cfg-cert-3',
        titulo: 'Consecutivo',
        cuerpo:
          'Prefijo y número actual por sede/tipo. Se incrementa al emitir.',
      },
    ],
  },
  'config.catalogos': {
    id: 'config.catalogos',
    modulo: 'config',
    saludo: 'Catálogos generales del sistema.',
    tips: [
      {
        id: 'cfg-cat-1',
        titulo: 'Datos maestros',
        cuerpo:
          'EPS, ocupaciones, tipos documento, estados civiles… Usados en combobox de formularios.',
      },
      {
        id: 'cfg-cat-2',
        titulo: 'Editar etiqueta',
        cuerpo:
          'Cambiar texto visible no borra valores ya guardados en alumnos (códigos internos).',
      },
    ],
  },
  'config.georef': {
    id: 'config.georef',
    modulo: 'config',
    saludo: 'Georreferenciación — municipios Colombia.',
    tips: [
      {
        id: 'cfg-geo-1',
        titulo: 'Sincronización DANE',
        cuerpo:
          'Actualiza listado oficial de municipios para alumnos, clientes FE y reportes.',
      },
    ],
  },
  'config.nomina': {
    id: 'config.nomina',
    modulo: 'config',
    saludo: 'Parámetros de nómina.',
    tips: [
      {
        id: 'cfg-nom-1',
        titulo: 'Porcentajes legales',
        cuerpo:
          'Salud, pensión, ARL, parafiscales. Revise con contador cada año.',
      },
      {
        id: 'cfg-nom-2',
        titulo: 'Auxilios y deducciones',
        cuerpo:
          'Conceptos recurrentes aplicados en liquidación.',
      },
    ],
  },
  'config.requisitos': {
    id: 'config.requisitos',
    modulo: 'config',
    saludo: 'Requisitos documentales (alumnos, vehículos, empleados).',
    tips: [
      {
        id: 'cfg-req-1',
        titulo: 'Tipos de expediente',
        cuerpo:
          'Defina qué documentos exige el CEA por categoría. Aparecen en pestaña Documentos del alumno/vehículo/empleado.',
      },
      {
        id: 'cfg-req-2',
        titulo: 'Obligatorio vs opcional',
        cuerpo:
          'Obligatorio bloquea trámites si falta. Opcional solo informativo.',
      },
      {
        id: 'cfg-req-3',
        titulo: 'Vencimiento',
        cuerpo:
          'Si aplica, ARGO alerta X días antes. Coherente con inspección vehículos.',
      },
    ],
  },
  'config.auditoria': {
    id: 'config.auditoria',
    modulo: 'config',
    saludo: 'Auditoría y monitor del sistema.',
    tips: [
      {
        id: 'cfg-aud-1',
        titulo: 'Log de acciones',
        cuerpo:
          'Quién modificó datos sensibles, cuándo y desde qué módulo.',
      },
      {
        id: 'cfg-aud-2',
        titulo: 'Monitor recursos',
        cuerpo:
          'Estado técnico del servidor/API (si está habilitado). Para soporte TI.',
      },
    ],
  },
};
