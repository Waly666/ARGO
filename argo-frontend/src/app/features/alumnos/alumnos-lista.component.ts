import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap } from 'rxjs';

import { AlumnoListItem, AlumnoService } from '../../core/services/alumno.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'argo-alumnos-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos-lista.component.html',
  styleUrls: ['./alumnos-lista.component.scss'],
})
export class AlumnosListaComponent implements OnInit {
  private alumnoSvc = inject(AlumnoService);
  private router = inject(Router);

  uploads = environment.uploadsUrl;

  query = signal('');
  page = signal(0);
  pageSize = 25;

  loading = signal(false);
  items = signal<AlumnoListItem[]>([]);
  total = signal(0);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize)));
  pageLabel = computed(() => {
    const t = this.total();
    if (t === 0) return '0 registros';
    const from = this.page() * this.pageSize + 1;
    const to = Math.min((this.page() + 1) * this.pageSize, t);
    return `${from}–${to} de ${t}`;
  });

  private load$ = new Subject<{ q: string; page: number }>();

  ngOnInit(): void {
    this.load$
      .pipe(
        debounceTime(280),
        switchMap(({ q, page }) => {
          this.loading.set(true);
          return this.alumnoSvc.listar({ q, limit: this.pageSize, skip: page * this.pageSize });
        }),
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.items.set(res.items || []);
          this.total.set(res.total ?? 0);
        },
        error: () => {
          this.loading.set(false);
          this.items.set([]);
          this.total.set(0);
        },
      });

    this.cargar();
  }

  cargar() {
    this.load$.next({ q: this.query().trim(), page: this.page() });
  }

  onBuscar(v: string) {
    this.query.set(v);
    this.page.set(0);
    this.cargar();
  }

  paginaAnterior() {
    if (this.page() <= 0) return;
    this.page.update((p) => p - 1);
    this.cargar();
  }

  paginaSiguiente() {
    if (this.page() >= this.totalPages() - 1) return;
    this.page.update((p) => p + 1);
    this.cargar();
  }

  nuevo() {
    this.router.navigate(['/app/alumnos/nuevo']);
  }

  abrir(item: AlumnoListItem) {
    const id = item?._id ? String(item._id) : '';
    if (!id) return;
    this.router.navigate(['/app/alumnos', id]);
  }

  fotoUrl(f?: string): string | null {
    if (!f) return null;
    if (f.startsWith('http')) return f;
    return `${this.uploads}/${f}`;
  }
}
