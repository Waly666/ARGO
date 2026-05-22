import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AlumnoService } from '../../core/services/alumno.service';
import { AlumnoStore } from '../../core/services/alumno-store.service';
import { DatosPrincipalesComponent } from './tabs/datos-principales.component';
import { ServiciosComponent } from './tabs/servicios.component';
import { PagosComponent } from './tabs/pagos.component';
import { CertificadosComponent } from './tabs/certificados.component';
import { TabPlaceholderComponent } from './tabs/tab-placeholder.component';
import { environment } from '../../../environments/environment';

type TabKey = 'datos' | 'servicios' | 'pagos' | 'certificados' | 'documentos';

@Component({
  selector: 'argo-alumno-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatosPrincipalesComponent,
    ServiciosComponent,
    PagosComponent,
    CertificadosComponent,
    TabPlaceholderComponent,
  ],
  templateUrl: './alumno-detalle.component.html',
  styleUrls: ['./alumno-detalle.component.scss'],
})
export class AlumnoDetalleComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alumnoSvc = inject(AlumnoService);
  store = inject(AlumnoStore);

  tab = signal<TabKey>('datos');
  loading = signal(false);
  esNuevo = signal(false);
  uploads = environment.uploadsUrl;

  alumno = computed(() => this.store.alumno());
  nombreCompleto = computed(() => this.store.nombreCompleto());
  tituloPagina = computed(() => {
    if (this.esNuevo()) return 'Nuevo alumno';
    const n = this.nombreCompleto();
    return n || 'Ficha del alumno';
  });

  tabs: { key: TabKey; label: string }[] = [
    { key: 'datos',        label: 'Datos Principales' },
    { key: 'servicios',    label: 'Servicios' },
    { key: 'pagos',        label: 'Pagos' },
    { key: 'certificados', label: 'Certificados' },
    { key: 'documentos',   label: 'Documentos' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'nuevo') {
        this.esNuevo.set(true);
        this.store.clear();
        this.tab.set('datos');
        return;
      }
      this.esNuevo.set(false);
      this.cargarAlumno(id);
    });
  }

  errorMsg = signal<string | null>(null);

  ngOnDestroy(): void {
    this.store.clear();
  }

  cargarAlumno(id: string) {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.alumnoSvc.porId(id).subscribe({
      next: (a) => {
        this.store.setAlumno(a);
        this.loading.set(false);
        this.tab.set('datos');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message || 'No se pudo cargar el alumno.');
      },
    });
  }

  setTab(t: TabKey) {
    if (this.esNuevo() && t !== 'datos') return;
    this.tab.set(t);
  }

  volver() {
    this.router.navigate(['/app/alumnos']);
  }

  fotoUrl(): string | null {
    const a = this.alumno() as Record<string, unknown> | null;
    const f = (a?.['urlFoto'] || a?.['foto']) as string | undefined;
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }
}
