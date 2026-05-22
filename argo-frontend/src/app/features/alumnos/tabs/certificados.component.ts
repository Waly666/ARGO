import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AlumnoStore } from '../../../core/services/alumno-store.service';
import { CertificadoService } from '../../../core/services/certificado.service';
import { labelOrientacion, labelTipoCert } from '../../../core/constants/tipos-certificado';
import {
  ConfigCertificadoService,
  PlantillaCertificado,
} from '../../../core/services/config-certificado.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'argo-certificados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './certificados.component.html',
  styleUrls: ['./certificados.component.scss'],
})
export class CertificadosComponent {
  store = inject(AlumnoStore);
  private certSvc = inject(CertificadoService);
  private cfgCertSvc = inject(ConfigCertificadoService);
  private confirmSvc = inject(ConfirmDialogService);

  elegibles = signal<any[]>([]);
  certificados = signal<any[]>([]);
  plantillas = signal<PlantillaCertificado[]>([]);

  idLiquidacion = signal<string>('');
  idPlantilla = signal<string>('');
  numActa = signal<string>('');
  numFolio = signal<string>('');
  numRunt = signal<string>('');
  observaciones = signal<string>('');

  loading = signal(false);
  saving = signal(false);
  msg = signal<string | null>(null);

  elegibleSel = computed(() => this.elegibles().find((e) => e._id === this.idLiquidacion()));

  plantillaActiva = computed(() => {
    const id = this.idPlantilla();
    if (!id) return undefined;
    return this.plantillas().find((p) => p._id === id);
  });

  labelTipo = labelTipoCert;
  labelOrientacion = labelOrientacion;

  constructor() {
    this.cfgCertSvc.listarPlantillasTodas().subscribe({
      next: (r) => this.plantillas.set(r || []),
    });

    effect(() => {
      const nd = this.store.numDoc();
      if (nd) this.recargar(nd);
      else {
        this.elegibles.set([]);
        this.certificados.set([]);
      }
    });
  }

  onSeleccionarElegible(id: string) {
    this.idLiquidacion.set(id);
    const es = this.elegibles().find((e) => e._id === id);
    if (es?.plantillaSugeridaId) {
      this.idPlantilla.set(es.plantillaSugeridaId);
    } else {
      this.idPlantilla.set('');
    }
  }

  recargar(numDoc: string) {
    this.loading.set(true);
    this.certSvc.elegibles(numDoc).subscribe({
      next: (r) => this.elegibles.set(r || []),
    });
    this.certSvc.listarPorAlumno(numDoc).subscribe({
      next: (r) => {
        this.certificados.set(r || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  emitir() {
    const nd = this.store.numDoc();
    if (!nd) {
      this.msg.set('Selecciona un alumno primero.');
      return;
    }
    if (!this.idLiquidacion()) {
      this.msg.set('Selecciona un programa elegible.');
      return;
    }
    const es = this.elegibleSel();
    if (!this.idPlantilla()) {
      this.msg.set(
        es?.tipoCertificadoLabel
          ? `No hay formato configurado para «${es.tipoCertificadoLabel}». Configúrelo en Config. Certificados.`
          : 'No hay formato de certificado configurado.',
      );
      return;
    }
    this.saving.set(true);
    this.msg.set(null);
    this.certSvc
      .crear({
        numDoc: nd,
        idLiquidacion: this.idLiquidacion(),
        idPlantilla: this.idPlantilla() || undefined,
        numActa: this.numActa() || undefined,
        numFolio: this.numFolio() || undefined,
        numRunt: this.numRunt() || undefined,
        observaciones: this.observaciones() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.idLiquidacion.set('');
          this.idPlantilla.set('');
          this.numActa.set('');
          this.numFolio.set('');
          this.numRunt.set('');
          this.observaciones.set('');
          this.recargar(nd);
          this.msg.set('Certificado emitido.');
        },
        error: (e) => {
          this.saving.set(false);
          this.msg.set(e?.error?.message || 'Error emitiendo certificado.');
        },
      });
  }

  async anular(c: any) {
    const nd = this.store.numDoc();
    if (!nd) return;
    const prog = c.programaDescr || c.idProg || 'certificado';
    const ok = await this.confirmSvc.open({
      title: '¿Anular este certificado?',
      message: `Se anulará el certificado del programa «${prog}». Esta acción no se puede deshacer.`,
      variant: 'danger',
      icon: 'delete',
      confirmLabel: 'Sí, anular',
    });
    if (!ok) return;
    this.certSvc.eliminar(c._id).subscribe({
      next: () => this.recargar(nd),
      error: (e) => this.msg.set(e?.error?.message || 'Error anulando.'),
    });
  }

  imprimir(c: { _id: string }) {
    this.certSvc.abrirHtml(c._id, (m) => this.msg.set(m));
  }

  fmt(v: any): string {
    if (v == null) return '';
    if (typeof v === 'object' && v.$numberDecimal != null) v = Number(v.$numberDecimal);
    const n = Number(v) || 0;
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }
  fecha(f?: string) {
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-CO');
  }
}
