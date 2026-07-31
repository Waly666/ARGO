import { normalizeUtterance } from './normalize';

export type VoiceCommandId =
  | 'siguiente'
  | 'anterior'
  | 'iniciar'
  | 'finalizar'
  | 'inscribir'
  | 'guardar'
  | 'limpiar'
  | 'buscar';

export type VoiceCommandDef = {
  id: VoiceCommandId | string;
  /** Frases completas que activan el comando (no se insertan como texto). */
  phrases: string[];
  /** Si true, muestra confirmación en pantalla antes de ejecutar. */
  requireConfirm?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
};

/** Catálogo de frases tolerantes a variantes del habla. */
export const VOICE_PHRASES: Record<VoiceCommandId, string[]> = {
  siguiente: [
    'siguiente',
    'siguiente campo',
    'campo siguiente',
    'pasar',
    'pasar al siguiente',
    'siguiente por favor',
  ],
  anterior: [
    'anterior',
    'campo anterior',
    'atras',
    'atrás',
    'volver al campo',
    'campo previo',
  ],
  iniciar: [
    'iniciar',
    'inicia',
    'iniciar clase',
    'inicia clase',
    'iniciar cronometro',
    'iniciar cronómetro',
    'inicia cronometro',
    'empezar',
    'empezar clase',
    'comienza',
    'comenzar',
    'comenzar clase',
  ],
  finalizar: [
    'finalizar',
    'finaliza',
    'finalizar clase',
    'finaliza clase',
    'terminar',
    'terminar clase',
    'cerrar clase',
    'cierra clase',
  ],
  inscribir: [
    'inscribir',
    'inscribe',
    'inscribir alumno',
    'matricular',
    'matricular alumno',
    'registrar',
    'registrar alumno',
  ],
  guardar: ['guardar', 'guarda', 'guardar alumno', 'guardar ficha', 'salvar'],
  limpiar: ['limpiar', 'limpia', 'borrar', 'borrar campo', 'vaciar'],
  buscar: ['buscar', 'busca', 'consultar'],
};

export type MatchedVoiceCommand = {
  id: string;
  requireConfirm: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
};

/**
 * Solo coincide si la frase completa es un comando (evita escribir "Siguiente" como nombre).
 */
export function matchVoiceCommand(
  transcript: string,
  commands: VoiceCommandDef[],
): MatchedVoiceCommand | null {
  const n = normalizeUtterance(transcript);
  if (!n) return null;

  for (const cmd of commands) {
    for (const phrase of cmd.phrases) {
      const p = normalizeUtterance(phrase);
      if (!p) continue;
      if (n === p) {
        return {
          id: cmd.id,
          requireConfirm: Boolean(cmd.requireConfirm),
          confirmTitle: cmd.confirmTitle,
          confirmMessage: cmd.confirmMessage,
        };
      }
    }
  }
  return null;
}

/** Texto dictado listo para pegar en un campo (sin puntuación final típica del ASR). */
export function cleanDictationText(transcript: string): string {
  return String(transcript || '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?]+$/g, '')
    .trim();
}
