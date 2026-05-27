import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';

export interface EnumBuscarOption {
  value: string | number;
  label: string;
  hint?: string;
}

@Component({
  selector: 'argo-catalogo-enum-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogo-enum-buscar.component.html',
  styleUrls: ['./catalogo-enum-buscar.component.scss'],
})
export class CatalogoEnumBuscarComponent implements OnChanges {
  @Input() label = '';
  @Input() placeholder = 'Escriba para buscar…';
  @Input() textoInicial = '';
  @Input() disabled = false;
  @Input() minLength = 2;
  /** Si true, usa `buscarRemoto`; si false, filtra `opcionesLocales`. */
  @Input() remoto = true;
  @Input() opcionesLocales: EnumBuscarOption[] = [];
  @Input() buscarRemoto?: (q: string) => Observable<EnumBuscarOption[]>;

  seleccionado = output<EnumBuscarOption>();
  limpiado = output<void>();

  query = signal('');
  open = signal(false);
  loading = signal(false);
  resultados = signal<EnumBuscarOption[]>([]);

  private q$ = new Subject<string>();

  constructor() {
    this.q$
      .pipe(
        debounceTime(220),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading.set(true);
          if (this.remoto) {
            if (!this.buscarRemoto) return of([]);
            return this.buscarRemoto(q);
          }
          return of(this.filtrarLocal(q));
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
    if (changes['textoInicial']) {
      const next = this.textoInicial || '';
      if (next !== this.query()) this.query.set(next);
    }
    if (changes['opcionesLocales'] && this.open() && !this.remoto) {
      this.q$.next(this.query());
    }
  }

  onInput(v: string): void {
    if (this.disabled) return;
    this.query.set(v);
    this.open.set(true);
    const q = (v || '').trim();
    if (!q) {
      this.resultados.set([]);
      this.limpiado.emit();
      return;
    }
    if (q.length >= this.minLength) this.q$.next(q);
    else this.resultados.set([]);
  }

  focus(): void {
    if (this.disabled) return;
    this.open.set(true);
    const q = this.query().trim();
    if (q.length >= this.minLength) this.q$.next(q);
  }

  pick(opt: EnumBuscarOption): void {
    this.query.set(opt.label);
    this.open.set(false);
    this.resultados.set([]);
    this.seleccionado.emit(opt);
  }

  private filtrarLocal(q: string): EnumBuscarOption[] {
    const nq = this.normalizar(q.trim());
    if (!nq) return [];
    return (this.opcionesLocales || [])
      .filter((o) => this.coincideBusqueda(nq, o.label, o.hint))
      .slice(0, 40);
  }

  private normalizar(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private coincideBusqueda(nq: string, label: string, hint?: string): boolean {
    const nl = this.normalizar(label);
    if (nl.startsWith(nq)) return true;
    if (hint && this.normalizar(hint).startsWith(nq)) return true;
    return nl.split(/[\s(/\-]+/).some((w) => w.startsWith(nq));
  }

  @HostListener('document:click', ['$event'])
  outside(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (!t.closest('.enum-buscar-host')) {
      this.open.set(false);
    }
  }
}
