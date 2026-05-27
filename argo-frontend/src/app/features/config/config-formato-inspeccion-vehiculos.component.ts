import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CatalogosInspeccionVehiculo,
  ConfigFormatoInspeccionVehiculos,
  ConfigFormatoInspeccionVehiculosService,
  FormatoInspeccionPorClase,
  ItemCatalogoInspeccion,
  SeccionFormatoInspeccion,
} from '../../core/services/config-formato-inspeccion-vehiculos.service';
import { ClaseVehiculo, VehiculoService } from '../../core/services/vehiculo.service';

interface ClaseRow {
  idClase: string;
  label: string;
}

type SeccionUi = 'estadoGeneral' | 'aspecto1' | 'aspecto2' | 'adaptaciones';

const SECCION_CAMPO: Record<SeccionUi, SeccionFormatoInspeccion> = {
  estadoGeneral: 'idItemsEstGral',
  aspecto1: 'idAspecto1',
  aspecto2: 'idAspecto2',
  adaptaciones: 'idAdaptaciones',
};

const SECCION_CATALOGO: Record<SeccionUi, keyof CatalogosInspeccionVehiculo> = {
  estadoGeneral: 'itemsEstGral',
  aspecto1: 'aspecto1',
  aspecto2: 'aspecto2',
  adaptaciones: 'adaptaciones',
};

@Component({
  selector: 'argo-config-formato-inspeccion-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-formato-inspeccion-vehiculos.component.html',
  styleUrls: ['./config-formato-inspeccion-vehiculos.component.scss'],
})
export class ConfigFormatoInspeccionVehiculosComponent implements OnInit {
  private cfgSvc = inject(ConfigFormatoInspeccionVehiculosService);
  private vehSvc = inject(VehiculoService);

  seccion = signal<SeccionUi>('estadoGeneral');
  catalogos = signal<CatalogosInspeccionVehiculo>({
    itemsEstGral: [],
    aspecto1: [],
    aspecto2: [],
    adaptaciones: [],
  });
  requisitosPorClase = signal<FormatoInspeccionPorClase[]>([]);
  prefijoConsecutivo = signal('INSP');
  consecutivoInspeccion = signal(0);
  proximoConsecutivoPreview = computed(() => {
    const pref = String(this.prefijoConsecutivo() || 'INSP').trim() || 'INSP';
    const n = Math.max(0, this.consecutivoInspeccion()) + 1;
    return `${pref}-${String(n).padStart(6, '0')}`;
  });
  clases = signal<ClaseRow[]>([]);

  saving = signal(false);
  msg = signal<string | null>(null);
  err = signal(false);

  secciones: { key: SeccionUi; label: string }[] = [
    { key: 'estadoGeneral', label: 'Estado general' },
    { key: 'aspecto1', label: 'Aspecto 1 — emergencias' },
    { key: 'aspecto2', label: 'Aspecto 2 — seguridad' },
    { key: 'adaptaciones', label: 'Adaptaciones CEA' },
  ];

  itemsSeccion = computed<ItemCatalogoInspeccion[]>(() => {
    const cat = this.catalogos();
    const key = SECCION_CATALOGO[this.seccion()];
    return cat[key] || [];
  });

  ngOnInit(): void {
    this.vehSvc.listarClases().subscribe({
      next: (rows) => {
        const caps = (rows || [])
          .map((r: ClaseVehiculo) => ({
            idClase: String(r.idClase ?? '').trim(),
            label: String(r.descripcion || r.idClase || '').trim(),
          }))
          .filter((c) => c.idClase);
        this.clases.set(caps);
        this.syncRequisitosConClases();
      },
    });

    this.cfgSvc.obtener().subscribe({
      next: (c) => this.applyConfig(c),
      error: () => this.setMsg('No se pudo cargar la configuración', true),
    });
  }

  private applyConfig(c: ConfigFormatoInspeccionVehiculos) {
    this.catalogos.set(c.catalogos || { itemsEstGral: [], aspecto1: [], aspecto2: [], adaptaciones: [] });
    this.requisitosPorClase.set([...(c.requisitosPorClase || [])]);
    this.prefijoConsecutivo.set(c.prefijoConsecutivoInspeccion || 'INSP');
    this.consecutivoInspeccion.set(c.consecutivoInspeccion ?? 0);
    this.syncRequisitosConClases();
  }

  private syncRequisitosConClases() {
    const caps = this.clases();
    if (!caps.length) return;
    const map = new Map(this.requisitosPorClase().map((r) => [r.idClase, r]));
    const merged: FormatoInspeccionPorClase[] = caps.map((c) => {
      const prev = map.get(c.idClase);
      return (
        prev || {
          idClase: c.idClase,
          idItemsEstGral: [],
          idAspecto1: [],
          idAspecto2: [],
          idAdaptaciones: [],
        }
      );
    });
    this.requisitosPorClase.set(merged);
  }

  setSeccion(s: SeccionUi) {
    this.seccion.set(s);
  }

  requisitoClase(idClase: string): FormatoInspeccionPorClase {
    return (
      this.requisitosPorClase().find((r) => r.idClase === idClase) || {
        idClase,
        idItemsEstGral: [],
        idAspecto1: [],
        idAspecto2: [],
        idAdaptaciones: [],
      }
    );
  }

  campoSeccion(): SeccionFormatoInspeccion {
    return SECCION_CAMPO[this.seccion()];
  }

  tieneItemClase(idClase: string, itemId: string): boolean {
    const campo = this.campoSeccion();
    const req = this.requisitoClase(idClase);
    return (req[campo] || []).includes(itemId);
  }

  todosMarcadosClase(idClase: string): boolean {
    const items = this.itemsSeccion();
    if (!items.length) return false;
    return items.every((i) => this.tieneItemClase(idClase, i.id));
  }

  toggleItemClase(idClase: string, itemId: string, checked: boolean) {
    const campo = this.campoSeccion();
    this.requisitosPorClase.update((rows) =>
      rows.map((r) => {
        if (r.idClase !== idClase) return r;
        const set = new Set(r[campo] || []);
        if (checked) set.add(itemId);
        else set.delete(itemId);
        return { ...r, [campo]: [...set] };
      }),
    );
  }

  marcarTodosClase(idClase: string, checked: boolean) {
    const campo = this.campoSeccion();
    const ids = this.itemsSeccion().map((i) => i.id);
    this.requisitosPorClase.update((rows) =>
      rows.map((r) => {
        if (r.idClase !== idClase) return r;
        return { ...r, [campo]: checked ? [...ids] : [] };
      }),
    );
  }

  guardar() {
    this.saving.set(true);
    this.setMsg(null, false);
    this.cfgSvc
      .guardar({
        requisitosPorClase: this.requisitosPorClase(),
        prefijoConsecutivoInspeccion: this.prefijoConsecutivo(),
        consecutivoInspeccion: this.consecutivoInspeccion(),
      })
      .subscribe({
        next: (c) => {
          this.applyConfig(c);
          this.saving.set(false);
          this.setMsg('Formato de inspección guardado.', false);
        },
        error: (e) => {
          this.saving.set(false);
          this.setMsg(e?.error?.message || 'Error al guardar', true);
        },
      });
  }

  private setMsg(text: string | null, isErr: boolean) {
    this.msg.set(text);
    this.err.set(isErr);
  }
}
