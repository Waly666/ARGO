import { Injectable, computed, signal } from '@angular/core';

import type { AlumnoDto } from './alumno.service';

@Injectable({ providedIn: 'root' })
export class AlumnoStore {
  private _alumno = signal<AlumnoDto | null>(null);

  alumno = computed(() => this._alumno());
  hasAlumno = computed(() => !!this._alumno()?._id);
  numDoc = computed(() => this._alumno()?.numDoc ?? null);

  nombreCompleto = computed(() => {
    const a = this._alumno();
    if (!a) return null;
    const n = [a.nombre1, a.nombre2].filter(Boolean).join(' ').trim();
    const ap = [a.apellido1, a.apellido2].filter(Boolean).join(' ').trim();
    return `${n} ${ap}`.trim() || null;
  });

  setAlumno(a: AlumnoDto | null) {
    this._alumno.set(a ? { ...a } : null);
  }

  clear() {
    this._alumno.set(null);
  }
}
