import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AulaVirtualEventoAlerta {
  id: string;
  numDoc: number;
  nombreAlumno: string;
  email?: string;
  idPrograma?: string;
  nombrePrograma?: string;
  alumnoNuevo?: boolean;
  createdAt?: string;
}

export interface AulaVirtualEventosAlertasResponse {
  registro: AulaVirtualEventoAlerta[];
  matricula: AulaVirtualEventoAlerta[];
}

@Injectable({ providedIn: 'root' })
export class AulaVirtualPortalAlertService {
  private router = inject(Router);

  private vistosRegistro = new Set<string>();
  private vistosMatricula = new Set<string>();

  private readonly _registro = signal<AulaVirtualEventoAlerta[]>([]);
  private readonly _matricula = signal<AulaVirtualEventoAlerta[]>([]);

  readonly registroAlertas = this._registro.asReadonly();
  readonly matriculaAlertas = this._matricula.asReadonly();

  actualizar(
    data: AulaVirtualEventosAlertasResponse | null | undefined,
    opts: { registro: boolean; matricula: boolean },
  ) {
    if (!data) {
      if (!opts.registro) this._registro.set([]);
      if (!opts.matricula) this._matricula.set([]);
      return;
    }

    if (opts.registro) {
      const rows = (data.registro || []).filter((e) => e.id && !this.vistosRegistro.has(e.id));
      this._registro.set(rows.slice(0, 12));
    } else {
      this._registro.set([]);
    }

    if (opts.matricula) {
      const rows = (data.matricula || []).filter((e) => e.id && !this.vistosMatricula.has(e.id));
      this._matricula.set(rows.slice(0, 15));
    } else {
      this._matricula.set([]);
    }
  }

  abrirRegistro(alerta: AulaVirtualEventoAlerta) {
    this.descartarRegistro(alerta.id);
    void this.router.navigate(['/app/aula-virtual'], { queryParams: { tab: 'usuarios' } });
  }

  abrirMatricula(alerta: AulaVirtualEventoAlerta) {
    this.descartarMatricula(alerta.id);
    const idPrograma = String(alerta.idPrograma || '').trim();
    if (idPrograma) {
      void this.router.navigate(['/app/aula-virtual/cursos', idPrograma], {
        queryParams: { tab: 'alumnos' },
      });
      return;
    }
    void this.router.navigate(['/app/aula-virtual']);
  }

  descartarRegistro(id: string) {
    const key = String(id || '');
    if (key) this.vistosRegistro.add(key);
    this._registro.update((list) => list.filter((a) => a.id !== key));
  }

  descartarMatricula(id: string) {
    const key = String(id || '');
    if (key) this.vistosMatricula.add(key);
    this._matricula.update((list) => list.filter((a) => a.id !== key));
  }

  descartarTodasRegistro() {
    for (const a of this._registro()) this.vistosRegistro.add(a.id);
    this._registro.set([]);
  }

  descartarTodasMatricula() {
    for (const a of this._matricula()) this.vistosMatricula.add(a.id);
    this._matricula.set([]);
  }

  limpiarTodo() {
    this.descartarTodasRegistro();
    this.descartarTodasMatricula();
  }
}
