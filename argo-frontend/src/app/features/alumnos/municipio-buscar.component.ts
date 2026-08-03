import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, of, switchMap } from 'rxjs';

import { CatalogoService, MunicipioDivipola } from '../../core/services/catalogo.service';

@Component({
  selector: 'argo-municipio-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './municipio-buscar.component.html',
  styleUrls: ['./municipio-buscar.component.scss'],
  host: {
    '[class.dropdown-open]': 'open()',
  },
})
export class MunicipioBuscarComponent implements OnChanges {
  private catSvc = inject(CatalogoService);

  @Input() label = 'Municipio';
  @Input() placeholder = 'Escriba para buscar municipio...';
  @Input() textoInicial = '';
  /** Combobox: flecha ▾ y búsqueda desde 1 carácter. */
  @Input() modoCombo = false;
  /**
   * Si se indica, solo lista/filtra municipios de ese departamento (cascada).
   * Vacío = búsqueda nacional.
   */
  @Input() codDepto = '';
  /** Deshabilitar hasta elegir departamento. */
  @Input() disabled = false;

  seleccionado = output<MunicipioDivipola>();
  limpiado = output<void>();
  /** Texto libre mientras escribe (expedida u otros campos sin código divipola). */
  textoChange = output<string>();

  query = signal('');
  open = signal(false);
  loading = signal(false);
  resultados = signal<MunicipioDivipola[]>([]);

  private q$ = new Subject<string>();

  constructor() {
    // Sin distinctUntilChanged: al cambiar de departamento el mismo texto (a menudo
    // vacío) debe volver a consultar con el nuevo filtro.
    this.q$
      .pipe(
        debounceTime(280),
        switchMap((q) => {
          this.loading.set(true);
          const depto = String(this.codDepto || '').trim();
          // Cascada: q vacío → lista del departamento; nacional: exige texto.
          if (!depto && !String(q || '').trim()) {
            return of([] as MunicipioDivipola[]);
          }
          const limit = depto ? 200 : 18;
          return this.catSvc.buscarMunicipios(q, limit, depto);
        }),
      )
      .subscribe({
        next: (rows) => {
          this.loading.set(false);
          this.resultados.set(rows || []);
        },
        error: () => {
          this.loading.set(false);
          this.resultados.set([]);
        },
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['textoInicial'] && !changes['textoInicial'].firstChange) {
      const next = this.textoInicial || '';
      if (next !== this.query()) this.query.set(next);
    } else if (changes['textoInicial']?.firstChange) {
      this.query.set(this.textoInicial || '');
    }
    if (changes['codDepto'] && !changes['codDepto'].firstChange) {
      // Al cambiar departamento, limpiar resultados; el padre limpia la selección.
      this.resultados.set([]);
      if (this.open() && this.codDepto) this.q$.next(this.query().trim());
    }
  }

  minBusqueda = (): number => (this.modoCombo || !!String(this.codDepto || '').trim() ? 1 : 2);

  onInput(v: string) {
    if (this.disabled) return;
    this.query.set(v);
    this.open.set(true);
    const q = (v || '').trim();
    if (!q) {
      this.limpiado.emit();
      // Con departamento: volver a listar todos los del depto.
      if (String(this.codDepto || '').trim()) this.q$.next('');
      else this.resultados.set([]);
      return;
    }
    this.textoChange.emit(q);
    if (q.length >= this.minBusqueda() || String(this.codDepto || '').trim()) {
      this.q$.next(q);
    } else {
      this.resultados.set([]);
    }
  }

  focus() {
    if (this.disabled) return;
    this.open.set(true);
    const q = this.query().trim();
    const depto = String(this.codDepto || '').trim();
    if (depto) this.q$.next(q);
    else if (q.length >= this.minBusqueda()) this.q$.next(q);
  }

  toggleOpen(): void {
    if (this.disabled) return;
    if (this.open()) {
      this.open.set(false);
      return;
    }
    this.open.set(true);
    const q = this.query().trim();
    const depto = String(this.codDepto || '').trim();
    if (depto) this.q$.next(q);
    else if (q.length >= this.minBusqueda()) this.q$.next(q);
  }

  pick(m: MunicipioDivipola) {
    const texto = String(m.nombreMunicipio || m.label || '').trim();
    this.query.set(texto);
    this.open.set(false);
    this.resultados.set([]);
    this.seleccionado.emit(m);
  }

  @HostListener('document:click', ['$event'])
  outside(ev: MouseEvent) {
    const t = ev.target as HTMLElement;
    if (!t.closest('.muni-buscar-host')) {
      this.open.set(false);
    }
  }
}
