import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { CatalogoService, MunicipioDivipola } from '../../core/services/catalogo.service';

@Component({
  selector: 'argo-municipio-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './municipio-buscar.component.html',
  styleUrls: ['./municipio-buscar.component.scss'],
})
export class MunicipioBuscarComponent implements OnChanges {
  private catSvc = inject(CatalogoService);

  @ViewChild('inputEl') inputRef?: ElementRef<HTMLInputElement>;

  @Input() label = 'Municipio';
  @Input() placeholder = 'Escriba para buscar municipio...';
  @Input() textoInicial = '';

  seleccionado = output<MunicipioDivipola>();

  query = signal('');
  open = signal(false);
  loading = signal(false);
  resultados = signal<MunicipioDivipola[]>([]);
  dropdownStyle = signal<{ top: string; left: string; width: string } | null>(null);

  private q$ = new Subject<string>();

  constructor() {
    this.q$
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          this.loading.set(true);
          return this.catSvc.buscarMunicipios(q, 18);
        }),
      )
      .subscribe({
        next: (rows) => {
          this.loading.set(false);
          this.resultados.set(rows || []);
          if (this.open()) queueMicrotask(() => this.updateDropdownPosition());
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
  }

  onInput(v: string) {
    this.query.set(v);
    this.open.set(true);
    const q = (v || '').trim();
    if (q.length >= 2) this.q$.next(q);
    else this.resultados.set([]);
    queueMicrotask(() => this.updateDropdownPosition());
  }

  focus() {
    this.open.set(true);
    const q = this.query().trim();
    if (q.length >= 2) this.q$.next(q);
    queueMicrotask(() => this.updateDropdownPosition());
  }

  pick(m: MunicipioDivipola) {
    this.query.set(m.label);
    this.open.set(false);
    this.dropdownStyle.set(null);
    this.resultados.set([]);
    this.seleccionado.emit(m);
  }

  private updateDropdownPosition() {
    const el = this.inputRef?.nativeElement;
    if (!el || !this.open()) {
      this.dropdownStyle.set(null);
      return;
    }
    const r = el.getBoundingClientRect();
    this.dropdownStyle.set({
      top: `${r.bottom + 4}px`,
      left: `${r.left}px`,
      width: `${Math.max(r.width, 280)}px`,
    });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange() {
    if (this.open()) this.updateDropdownPosition();
  }

  @HostListener('document:click', ['$event'])
  outside(ev: MouseEvent) {
    const t = ev.target as HTMLElement;
    if (!t.closest('.muni-buscar-host') && !t.closest('.muni-dropdown-panel')) {
      this.open.set(false);
      this.dropdownStyle.set(null);
    }
  }
}
