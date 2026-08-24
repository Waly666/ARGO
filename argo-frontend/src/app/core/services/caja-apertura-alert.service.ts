import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { AlarmaService } from './alarma.service';
import { AuthService } from './auth.service';
import { CajaEstadoService } from './caja-estado.service';
import { CajaSesionService } from './caja-sesion.service';
import { PermisoService } from './permiso.service';
import { AccionPermisoService } from './accion-permiso.service';
import { diasCalendarioColombiaDesde } from '../utils/fecha-colombia.util';

const SESSION_FLAG = 'argo_caja_post_login_alert';

@Injectable({ providedIn: 'root' })
export class CajaAperturaAlertService {
  private cajaSvc = inject(CajaSesionService);
  private cajaEstado = inject(CajaEstadoService);
  private confirm = inject(ConfirmDialogService);
  private router = inject(Router);
  private alarmas = inject(AlarmaService);
  private permisos = inject(PermisoService);
  private accionPermiso = inject(AccionPermisoService);
  private auth = inject(AuthService);

  private enCurso = false;

  /** true si la caja está abierta; si no, muestra aviso (si el rol lo tiene) y devuelve false. */
  async ensureAbierta(accion = 'registrar movimientos de caja'): Promise<boolean> {
    const abierta = await firstValueFrom(this.cajaSvc.activa().pipe(map((r) => !!r.abierta)));
    if (abierta) return true;
    await this.mostrarAviso(accion);
    return false;
  }

  async mostrarAviso(accion = 'registrar movimientos de caja'): Promise<void> {
    const ir = await this.confirm.open({
      title: 'Caja cerrada',
      message: `Debe abrir su caja antes de ${accion}.\n\nVaya a Resumen del día y pulse «Abrir caja» para iniciar su turno.`,
      variant: 'warn',
      icon: 'warning',
      confirmLabel: 'Ir a abrir caja',
      cancelLabel: 'Entendido',
    });
    if (ir) {
      await this.router.navigate(['/app/caja'], { queryParams: { abrir: 1 } });
    }
  }

  /** Llamar en logout para que el próximo login vuelva a avisar. */
  limpiarFlagSesion(): void {
    try {
      const u = this.auth.user();
      const ids = [u?._id, u?.username, 'anon'].filter(Boolean);
      for (const id of ids) {
        sessionStorage.removeItem(`${SESSION_FLAG}:${id}`);
      }
      // Limpieza amplia por si el id cambió entre lecturas.
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(SESSION_FLAG)) sessionStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * Tras validarse: avisa caja cerrada o caja abierta varios días.
   * Una sola vez por sesión de navegador (se limpia al logout).
   */
  async revisarAlEntrar(): Promise<void> {
    if (this.enCurso || !this.auth.isAuth()) return;
    if (!this.usuarioConAccesoCaja()) return;
    if (this.yaMostradaEnSesion()) return;

    const avisoLogin = this.puedeAvisarLoginCerrada();
    const avisoDias = this.puedeAvisarDiasAbiertos();
    if (!avisoLogin && !avisoDias) return;

    this.enCurso = true;
    try {
      await this.cajaEstado.refrescar();
      const abierta = this.cajaEstado.abierta() === true;
      const dias = this.resolverDiasSinCerrar();

      if (abierta && avisoDias && dias >= 1) {
        this.marcarMostradaEnSesion();
        await this.mostrarAlarmaDiasAbiertos(dias);
        return;
      }

      if (!abierta && avisoLogin) {
        this.marcarMostradaEnSesion();
        await this.mostrarAvisoLoginCajaCerrada();
      }
    } finally {
      this.enCurso = false;
    }
  }

  /** Acceso a módulos de caja (turno, admin, cobros o contabilidad). */
  usuarioConAccesoCaja(): boolean {
    return (
      this.permisos.tiene(['caja.turno', 'caja.admin', 'caja.cobros', 'contabilidad', 'ingresos.crear'])
      || this.accionPermiso.tiene('ingresos', 'crear')
    );
  }

  /**
   * Aviso al entrar sin caja: claves nuevas o las ya usadas en caja
   * (para no depender de que el rol ya tenga las alarmas recién agregadas).
   */
  puedeAvisarLoginCerrada(): boolean {
    return this.alarmas.tiene([
      'alarmas.caja.aviso_login',
      'alarmas.caja.cerrada',
      'alarmas.caja.sin_abrir',
    ]);
  }

  puedeAvisarDiasAbiertos(): boolean {
    return this.alarmas.tiene([
      'alarmas.caja.abierta_dias',
      'alarmas.caja.cerrada',
      'alarmas.caja.sin_abrir',
    ]);
  }

  private puedeAbrirTurno(): boolean {
    const rol = String(this.auth.user()?.rol || '').toLowerCase();
    if (rol === 'admin' || rol === 'contador') return false;
    return this.permisos.tiene('caja.turno') || this.accionPermiso.tiene('ingresos', 'crear');
  }

  private storageKey(): string {
    const u = this.auth.user();
    const id = u?._id ?? u?.username ?? 'anon';
    return `${SESSION_FLAG}:${id}`;
  }

  private yaMostradaEnSesion(): boolean {
    try {
      return sessionStorage.getItem(this.storageKey()) === '1';
    } catch {
      return false;
    }
  }

  private marcarMostradaEnSesion(): void {
    try {
      sessionStorage.setItem(this.storageKey(), '1');
    } catch {
      /* ignore */
    }
  }

  /** Prefiere API; si falta, calcula desde fechaApertura (calendario Colombia). */
  private resolverDiasSinCerrar(): number {
    const api = this.cajaEstado.diasSinCerrar();
    if (api > 0) return api;
    const fa = this.cajaEstado.sesion()?.fechaApertura;
    if (!fa) return api;
    const calc = diasCalendarioColombiaDesde(fa);
    return Math.max(api, calc);
  }

  private async mostrarAvisoLoginCajaCerrada(): Promise<void> {
    if (this.puedeAbrirTurno()) {
      const ir = await this.confirm.open({
        title: 'Caja no abierta',
        message:
          'Su caja personal no está abierta.\n\nPuede abrirla ahora para registrar ingresos y egresos del turno, o cancelar y continuar sin abrirla.',
        variant: 'warn',
        icon: 'warning',
        confirmLabel: 'Abrir caja',
        cancelLabel: 'Cancelar',
      });
      if (ir) {
        await this.router.navigate(['/app/caja'], { queryParams: { abrir: 1 } });
      }
      return;
    }

    await this.confirm.open({
      title: 'Caja no abierta',
      message:
        'No tiene una caja personal abierta en este momento.\n\nSi debe operar como cajero, abra su caja en Flujo de caja → Resumen del día. Si solo consulta, puede continuar.',
      variant: 'warn',
      icon: 'info',
      confirmLabel: 'Aceptar',
      cancelLabel: 'Cancelar',
    });
  }

  private async mostrarAlarmaDiasAbiertos(dias: number): Promise<void> {
    const sesion = this.cajaEstado.sesion();
    const n = Math.max(1, dias);
    const textoDias = n === 1 ? '1 día' : `${n} días`;
    const idTxt = sesion?.idSesion != null ? ` (sesión #${sesion.idSesion})` : '';
    const ir = await this.confirm.open({
      title: 'Alarma: caja sin cerrar',
      message:
        `Lleva ${textoDias} sin cerrar su caja${idTxt}.\n\n` +
        'Es imperativo que cierre la caja adecuadamente (cuadre y cierre del turno). ' +
        'Dejar la caja abierta varios días afecta el control de efectivo y los reportes.',
      variant: 'danger',
      icon: 'warning',
      confirmLabel: 'Ir a cerrar caja',
      cancelLabel: 'Entendido',
    });
    if (ir) {
      await this.router.navigate(['/app/caja']);
    }
  }
}
