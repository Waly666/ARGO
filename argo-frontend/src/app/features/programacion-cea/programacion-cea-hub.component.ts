import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PermisoService } from '../../core/services/permiso.service';
import {
  BloqueHorarioCea,
  ConfigProgramacionCea,
  FilaRastreoCea,
  ProgramaCeaDto,
  ProgramacionCeaService,
  TemaProgramaCeaDto,
  labelOrigenHorasCea,
  labelTipoHorasCea,
} from '../../core/services/programacion-cea.service';
import { ProgramacionCeaClasesComponent } from './programacion-cea-clases.component';

import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';

type TabCea = 'inicio' | 'config' | 'temas' | 'clases' | 'pendientes';
type BloqueConfig = 'vehiculo' | 'aula' | 'taller';

@Component({
  selector: 'argo-programacion-cea-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ProgramacionCeaClasesComponent],
  templateUrl: './programacion-cea-hub.component.html',
  styleUrls: ['./programacion-cea-hub.component.scss'],
})
export class ProgramacionCeaHubComponent implements OnInit {
  private svc = inject(ProgramacionCeaService);
  private permisos = inject(PermisoService);
  private confirm = inject(ConfirmDialogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tab = signal<TabCea>('inicio');
  bloqueConfig = signal<BloqueConfig>('vehiculo');
  loading = signal(true);
  saving = signal(false);
  msg = signal<string | null>(null);
  msgTipo = signal<'ok' | 'error' | 'info'>('info');

  programas = signal<ProgramaCeaDto[]>([]);
  config = signal<ConfigProgramacionCea | null>(null);
  festivosAnio = signal<number>(new Date().getFullYear());
  festivos = signal<string[]>([]);

  progTemasSel = signal('');
  temas = signal<TemaProgramaCeaDto[]>([]);
  formTema = signal<Partial<TemaProgramaCeaDto>>({ tipo: 'teoria', orden: 1, activo: true });
  editTemaId = signal<string | null>(null);

  rastreo = signal<FilaRastreoCea[]>([]);
  alertasPrograma = signal<{ idProg: string; programaLabel: string; mensaje: string }[]>([]);
  totalPendientes = signal(0);
  claseQueryId: string | null = null;
  fechaQuery: string | null = null;

  puedeGestionar = computed(() => this.permisos.tiene('programacion_cea.gestionar'));

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((qp) => {
      const t = qp.get('tab') as TabCea | null;
      if (t && ['inicio', 'config', 'temas', 'clases', 'pendientes'].includes(t)) this.tab.set(t);
      const clase = qp.get('clase');
      if (clase) this.claseQueryId = clase;
      const fecha = qp.get('fecha');
      this.fechaQuery = fecha;
    });
    this.cargarBase();
  }

  setTab(t: TabCea) {
    this.tab.set(t);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tab: t }, queryParamsHandling: 'merge' });
    if (t === 'pendientes') this.cargarRastreo(true);
    if (t === 'temas' && this.progTemasSel()) this.cargarTemas();
    if (t === 'clases') this.cargarRastreo(true);
  }

  labelTipo = labelTipoHorasCea;
  labelOrigen = labelOrigenHorasCea;
  subHorarios: Array<'normal' | 'sabado' | 'domingo' | 'festivo'> = ['normal', 'sabado', 'domingo', 'festivo'];

  horarioSub(b: BloqueHorarioCea | undefined, sub: 'normal' | 'sabado' | 'domingo' | 'festivo') {
    if (!b) return { horaDesde: '', horaHasta: '' };
    const row = b[sub];
    if (row && typeof row === 'object') return row as { horaDesde?: string; horaHasta?: string };
    return { horaDesde: '', horaHasta: '' };
  }

  private cargarBase() {
    this.loading.set(true);
    this.svc.programas().subscribe({
      next: (p) => {
        this.programas.set(p);
        if (!this.progTemasSel() && p.length) this.progTemasSel.set(p[0].idProg);
      },
      error: () => this.flash('No se pudieron cargar los programas CEA', 'error'),
    });
    this.svc.obtenerConfig().subscribe({
      next: (c) => this.config.set(c),
      error: () => this.flash('No se pudo cargar la configuración', 'error'),
    });
    this.cargarFestivos();
    this.cargarRastreo(true);
    this.loading.set(false);
  }

  cargarFestivos() {
    this.svc.festivos(this.festivosAnio()).subscribe({
      next: (r) => {
        this.festivosAnio.set(r.anio);
        this.festivos.set(r.fechas || []);
      },
      error: () => undefined,
    });
  }

  cargarRastreo(soloPendientes = false) {
    this.svc.rastreoGlobal(soloPendientes).subscribe({
      next: (r) => {
        this.rastreo.set(r.filas || []);
        this.alertasPrograma.set(r.alertasPrograma || []);
        this.totalPendientes.set(r.totalPendientes ?? 0);
      },
      error: () => undefined,
    });
  }

  cargarTemas() {
    const id = this.progTemasSel();
    if (!id) return;
    this.svc.listarTemas(id).subscribe({
      next: (rows) => this.temas.set(rows),
      error: () => this.flash('No se pudieron cargar los temas', 'error'),
    });
  }

  onProgTemasChange(id: string) {
    this.progTemasSel.set(id);
    this.cancelarEdicionTema();
    this.cargarTemas();
  }

  patchConfigBloque(campo: string, valor: unknown) {
    const bloque = this.bloqueConfig();
    const cfg = this.config();
    if (!cfg) return;
    const next = structuredClone(cfg);
    (next[bloque] as Record<string, unknown>)[campo] = valor;
    this.config.set(next);
  }

  patchConfigSub(bloque: BloqueConfig, sub: string, campo: string, valor: string) {
    const cfg = this.config();
    if (!cfg) return;
    const next = structuredClone(cfg);
    const b = next[bloque] as Record<string, Record<string, string>>;
    b[sub] = { ...(b[sub] || {}), [campo]: valor };
    this.config.set(next);
  }

  toggleDuracion(h: number) {
    const cfg = this.config();
    if (!cfg) return;
    const next = structuredClone(cfg);
    const list = [...(next.vehiculo.duracionesPermitidas || [])];
    const idx = list.indexOf(h);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(h);
    list.sort((a, b) => a - b);
    next.vehiculo.duracionesPermitidas = list.length ? list : [1];
    this.config.set(next);
  }

  duracionActiva(h: number): boolean {
    return (this.config()?.vehiculo?.duracionesPermitidas || []).includes(h);
  }

  guardarConfig() {
    const cfg = this.config();
    if (!cfg || !this.puedeGestionar()) return;
    this.saving.set(true);
    this.svc.guardarConfig(cfg).subscribe({
      next: (c) => {
        this.config.set(c);
        this.flash('Configuración guardada', 'ok');
        this.saving.set(false);
      },
      error: (e) => {
        this.flash(e?.error?.message || 'Error al guardar', 'error');
        this.saving.set(false);
      },
    });
  }

  patchTema(campo: keyof TemaProgramaCeaDto, valor: unknown) {
    this.formTema.update((f) => ({ ...f, [campo]: valor }));
  }

  editarTema(t: TemaProgramaCeaDto) {
    this.editTemaId.set(t._id || null);
    this.formTema.set({ ...t });
  }

  cancelarEdicionTema() {
    this.editTemaId.set(null);
    this.formTema.set({ tipo: 'teoria', orden: 1, activo: true });
  }

  guardarTema() {
    const idProg = this.progTemasSel();
    const f = this.formTema();
    if (!idProg || !f.nombre?.trim()) {
      this.flash('Indique el nombre del tema', 'error');
      return;
    }
    this.saving.set(true);
    const editId = this.editTemaId();
    const req = editId
      ? this.svc.actualizarTema(editId, f)
      : this.svc.crearTema(idProg, f);
    req.subscribe({
      next: () => {
        this.cancelarEdicionTema();
        this.cargarTemas();
        this.flash(editId ? 'Tema actualizado' : 'Tema creado', 'ok');
        this.saving.set(false);
      },
      error: (e) => {
        this.flash(e?.error?.message || 'Error al guardar tema', 'error');
        this.saving.set(false);
      },
    });
  }

  async eliminarTema(t: TemaProgramaCeaDto) {
    if (!t._id) return;
    const ok = await this.confirm.open({
      title: 'Eliminar tema',
      message: `¿Eliminar «${t.nombre}»?`,
      variant: 'danger',
    });
    if (!ok) return;
    this.svc.eliminarTema(t._id).subscribe({
      next: () => {
        this.cargarTemas();
        this.flash('Tema eliminado', 'ok');
      },
      error: (e) => this.flash(e?.error?.message || 'No se pudo eliminar', 'error'),
    });
  }

  irAlumno(f: FilaRastreoCea) {
    void this.router.navigate(['/app/alumnos', f.numDoc]);
  }

  temasTeoria = computed(() => this.temas().filter((t) => t.tipo === 'teoria'));
  temasTaller = computed(() => this.temas().filter((t) => t.tipo === 'taller'));

  progSelInfo = computed(() => this.programas().find((p) => p.idProg === this.progTemasSel()));

  private flash(texto: string, tipo: 'ok' | 'error' | 'info') {
    this.msg.set(texto);
    this.msgTipo.set(tipo);
    window.setTimeout(() => this.msg.set(null), 5000);
  }
}
