import { Injectable, computed, signal } from '@angular/core';

import type { AlumnoDto } from './alumno.service';
import { formatNumDoc } from '../utils/num-doc.helpers';

@Injectable({ providedIn: 'root' })
export class AlumnoStore {
  private _alumno = signal<AlumnoDto | null>(null);
  private _liqTick = signal(0);

  alumno = computed(() => this._alumno());
  hasAlumno = computed(() => !!this._alumno()?._id);
  numDoc = computed(() => this._alumno()?.numDoc ?? null);
  liqTick = computed(() => this._liqTick());

  nombreCompleto = computed(() => {
    const a = this._alumno();
    if (!a) return null;
    const n = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
    const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
    return `${n} ${ap}`.trim() || null;
  });

  setAlumno(a: AlumnoDto | null) {
    if (!a) {
      this._alumno.set(null);
      return;
    }
    const copy = { ...a };
    if (copy.numDoc != null) copy.numDoc = formatNumDoc(copy.numDoc);
    this._alumno.set(copy);
  }

  clear() {
    this._alumno.set(null);
    this._liqTick.set(0);
    this._datosSinGuardar.set(false);
  }

  touchLiquidacion() {
    this._liqTick.update((n) => n + 1);
  }

  /** Datos principales con cambios aún no guardados en BD */
  private _datosSinGuardar = signal(false);
  datosSinGuardar = computed(() => this._datosSinGuardar());

  setDatosSinGuardar(v: boolean) {
    this._datosSinGuardar.set(v);
  }

  /** Pulso para avisar junto al botón Guardar/Crear (p. ej. al intentar cambiar de pestaña) */
  private _saveAlarmTick = signal(0);
  saveAlarmTick = computed(() => this._saveAlarmTick());

  pulseSaveAlarm() {
    this._saveAlarmTick.update((n) => n + 1);
  }
}
