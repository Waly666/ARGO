import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { CategoriaVirtual, CursoVirtual } from '../../core/models';
import { CursoCardComponent } from '../../shared/curso-card/curso-card.component';
import { resolveUploadUrl } from '../../core/upload-url.util';

@Component({
  selector: 'av-cursos',
  standalone: true,
  imports: [CommonModule, CursoCardComponent],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.scss',
})
export class CursosComponent implements OnInit {
  private api = inject(AulaApiService);
  private route = inject(ActivatedRoute);

  modo = signal<'tienda' | 'cursos'>('cursos');
  cursos = signal<CursoVirtual[]>([]);
  categorias = signal<CategoriaVirtual[]>([]);
  logoUrl = signal<string | null>(null);
  q = signal('');
  catSel = signal<number | null>(null);

  ngOnInit() {
    const m = this.route.snapshot.data['modo'];
    this.modo.set(m === 'tienda' ? 'tienda' : 'cursos');
    this.api.config().subscribe({
      next: (cfg) => this.logoUrl.set(resolveUploadUrl(cfg.urlLogoAbsoluta || cfg.urlLogo)),
    });
    this.api.categorias().subscribe({ next: (rows) => this.categorias.set(rows) });
    this.cargar();
  }

  cargar() {
    this.api.cursos(this.q(), this.catSel()).subscribe({ next: (rows) => this.cursos.set(rows) });
  }

  filtrarCategoria(id: number | null) {
    this.catSel.set(id);
    this.cargar();
  }
}
