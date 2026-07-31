/**
 * Prueba rápida de matching de comandos (sin nativo / sin APK).
 * Ejecutar: npx --yes tsx src/voice/voiceCommands.selftest.ts
 */
import {
  VOICE_PHRASES,
  cleanDictationText,
  matchVoiceCommand,
  type VoiceCommandDef,
} from './commands';
import { normalizeUtterance } from './normalize';

const commands: VoiceCommandDef[] = [
  { id: 'siguiente', phrases: VOICE_PHRASES.siguiente },
  { id: 'anterior', phrases: VOICE_PHRASES.anterior },
  { id: 'iniciar', phrases: VOICE_PHRASES.iniciar, requireConfirm: true },
  { id: 'finalizar', phrases: VOICE_PHRASES.finalizar, requireConfirm: true },
  { id: 'inscribir', phrases: VOICE_PHRASES.inscribir },
  { id: 'guardar', phrases: VOICE_PHRASES.guardar, requireConfirm: true },
  { id: 'limpiar', phrases: VOICE_PHRASES.limpiar },
];

type Case = { input: string; expectId: string | null; note: string };

const cases: Case[] = [
  { input: 'siguiente', expectId: 'siguiente', note: 'comando exacto' },
  { input: 'Siguiente campo', expectId: 'siguiente', note: 'variante + mayúsculas' },
  { input: 'íniciar', expectId: 'iniciar', note: 'tilde rara / normalización' },
  { input: 'INICIA', expectId: 'iniciar', note: 'variante inicia' },
  { input: 'empezar clase', expectId: 'iniciar', note: 'sinónimo' },
  { input: 'finalizar clase', expectId: 'finalizar', note: 'finalizar' },
  { input: 'terminar', expectId: 'finalizar', note: 'sinónimo terminar' },
  { input: 'matricular alumno', expectId: 'inscribir', note: 'matricular' },
  { input: 'guardar', expectId: 'guardar', note: 'guardar' },
  { input: 'limpiar', expectId: 'limpiar', note: 'limpiar' },
  // No deben ser comando (se dictan al campo)
  { input: 'Juan Siguiente', expectId: null, note: 'NO comando si hay más texto' },
  { input: '1234567890', expectId: null, note: 'documento = dictado' },
  { input: 'Pérez', expectId: null, note: 'apellido = dictado' },
  { input: 'iniciar la reunión mañana', expectId: null, note: 'frase larga ≠ comando' },
];

let failed = 0;
for (const t of cases) {
  const m = matchVoiceCommand(t.input, commands);
  const got = m?.id ?? null;
  const ok = got === t.expectId;
  if (!ok) {
    failed += 1;
    console.error(`FAIL [${t.note}] "${t.input}" → ${got} (esperado ${t.expectId})`);
  } else {
    console.log(`ok  [${t.note}] "${t.input}" → ${got ?? 'dictado'}`);
  }
}

const n = normalizeUtterance('INICIÁR Cláse');
if (n !== 'iniciar clase') {
  failed += 1;
  console.error(`FAIL normalize: got "${n}"`);
} else {
  console.log(`ok  normalize "INICIÁR Cláse" → "${n}"`);
}

const cleaned = cleanDictationText('Pérez.');
if (cleaned !== 'Pérez') {
  failed += 1;
  console.error(`FAIL cleanDictation: got "${cleaned}"`);
} else {
  console.log(`ok  cleanDictation "Pérez." → "${cleaned}"`);
}

if (failed) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log(`\nTodas las pruebas pasaron (${cases.length + 2}).`);
