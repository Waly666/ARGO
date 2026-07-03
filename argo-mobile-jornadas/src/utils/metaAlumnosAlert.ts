import { Alert } from 'react-native';

export type MetaJornadaResp = {
  idJornada?: string | null;
  alumnosLleva?: number;
  metaAlumnos?: number;
  metaAlcanzada?: boolean;
  metaSuperada?: boolean;
  mensaje?: string | null;
} | null | undefined;

const vistos = new Set<string>();

/** Alarma al llegar o superar el tope de alumnos de la jornada (una vez por jornada/sesión). */
export function alertarMetaAlumnosJornada(
  meta: MetaJornadaResp,
  opts?: { contratoLabel?: string },
): boolean {
  if (!meta?.metaAlcanzada || !meta.mensaje) return false;
  const idJornada = String(meta.idJornada || '').trim();
  if (!idJornada) return false;
  const key = meta.metaSuperada ? `${idJornada}:superada` : `${idJornada}:alcanzada`;
  if (vistos.has(key)) return false;
  vistos.add(key);

  const titulo = meta.metaSuperada
    ? 'Tope de alumnos superado'
    : 'Tope de alumnos alcanzado';
  const contrato = opts?.contratoLabel ? `\n${opts.contratoLabel}` : '';
  Alert.alert(titulo, `${meta.mensaje}${contrato}`, [{ text: 'Entendido' }]);
  return true;
}

export function alertarMetaDesdeJornada(j: {
  _id?: string;
  metaAlcanzada?: boolean;
  metaSuperada?: boolean;
  alumnosLleva?: number;
  metaAlumnos?: number;
  numeObjeJornada?: number;
  contratoLabel?: string;
  codContrato?: string;
}): boolean {
  const metaAlumnos = Number(j.metaAlumnos ?? j.numeObjeJornada) || 0;
  const alumnosLleva = Number(j.alumnosLleva) || 0;
  const metaAlcanzada =
    j.metaAlcanzada === true || (metaAlumnos > 0 && alumnosLleva >= metaAlumnos);
  const metaSuperada =
    j.metaSuperada === true || (metaAlumnos > 0 && alumnosLleva > metaAlumnos);
  if (!metaAlcanzada) return false;
  return alertarMetaAlumnosJornada(
    {
      idJornada: j._id,
      alumnosLleva,
      metaAlumnos,
      metaAlcanzada,
      metaSuperada,
      mensaje: metaSuperada
        ? `Se superó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`
        : `Se alcanzó el tope de alumnos proyectados para esta jornada (${alumnosLleva}/${metaAlumnos}).`,
    },
    { contratoLabel: j.contratoLabel || j.codContrato },
  );
}
