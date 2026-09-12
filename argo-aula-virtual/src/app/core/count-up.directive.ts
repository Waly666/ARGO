import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject, input } from '@angular/core';

/** Cifra única detectada dentro del texto, con su formato original. */
interface ParsedValue {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
  decimalSep: string;
  /** Cadena vacía cuando el número no usa separador de miles. */
  groupSep: string;
}

/**
 * Anima de cero al valor mostrado cuando el elemento entra en pantalla.
 *
 * El texto lo escribe el ERP y puede tener cualquier forma ("85%", "1.200",
 * "24/7"). Por eso solo se anima cuando hay exactamente una cifra reconocible,
 * y al terminar se restaura la cadena original sin reformatear.
 */
@Directive({
  selector: '[avCountUp]',
  standalone: true,
})
export class CountUpDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);

  countUpDuration = input<number>(1100);
  countUpDelay = input<number>(0);

  private obs?: IntersectionObserver;
  private frame?: number;
  private timer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const node = this.el.nativeElement;
    const original = (node.textContent ?? '').trim();
    const parsed = parseSingleNumber(original);
    if (!parsed) return;

    this.obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        this.obs?.disconnect();
        this.obs = undefined;
        this.timer = setTimeout(() => this.run(node, original, parsed), Math.max(0, this.countUpDelay()));
      },
      { threshold: 0.4 },
    );
    this.obs.observe(node);
  }

  ngOnDestroy(): void {
    this.obs?.disconnect();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    if (this.timer !== undefined) clearTimeout(this.timer);
  }

  private run(node: HTMLElement, original: string, parsed: ParsedValue): void {
    const duration = Math.max(200, this.countUpDuration());

    this.zone.runOutsideAngular(() => {
      const started = performance.now();

      const step = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);

        if (progress < 1) {
          const eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = parsed.prefix + formatValue(parsed.target * eased, parsed) + parsed.suffix;
          this.frame = requestAnimationFrame(step);
          return;
        }

        node.textContent = original;
        this.frame = undefined;
      };

      node.textContent = parsed.prefix + formatValue(0, parsed) + parsed.suffix;
      this.frame = requestAnimationFrame(step);
    });
  }
}

function formatValue(value: number, parsed: ParsedValue): string {
  const [int, frac] = Math.abs(value).toFixed(parsed.decimals).split('.');
  const grouped = parsed.groupSep ? int.replace(/\B(?=(\d{3})+(?!\d))/g, parsed.groupSep) : int;
  return frac ? `${grouped}${parsed.decimalSep}${frac}` : grouped;
}

function parseSingleNumber(raw: string): ParsedValue | null {
  const matches = [...raw.matchAll(/\d[\d.,]*\d|\d/g)];
  // Con dos cifras ("24/7") no hay una sola magnitud que animar sin falsear el dato.
  if (matches.length !== 1) return null;

  const token = matches[0][0];
  const index = matches[0].index ?? 0;
  const prefix = raw.slice(0, index);
  const suffix = raw.slice(index + token.length);

  const parsed = parseToken(token);
  if (!parsed || !Number.isFinite(parsed.target) || parsed.target <= 0) return null;

  return { ...parsed, prefix, suffix };
}

function parseToken(token: string): Omit<ParsedValue, 'prefix' | 'suffix'> | null {
  // 1.234.567,89 — miles y decimales con separadores distintos
  const mixed = /^(\d{1,3}(?:([.,])\d{3})+)([.,])(\d{1,2})$/.exec(token);
  if (mixed && mixed[2] !== mixed[3]) {
    const [, intRaw, groupSep, decimalSep, frac] = mixed;
    return {
      target: Number(`${intRaw.split(groupSep).join('')}.${frac}`),
      decimals: frac.length,
      decimalSep,
      groupSep,
    };
  }

  // 1.200 / 1,234,567 — solo separador de miles
  const grouped = /^\d{1,3}(?:([.,])\d{3})+$/.exec(token);
  if (grouped) {
    const groupSep = grouped[1];
    return { target: Number(token.split(groupSep).join('')), decimals: 0, decimalSep: ',', groupSep };
  }

  // 4,8 / 4.8
  const decimal = /^(\d+)([.,])(\d{1,2})$/.exec(token);
  if (decimal) {
    return { target: Number(`${decimal[1]}.${decimal[3]}`), decimals: decimal[3].length, decimalSep: decimal[2], groupSep: '' };
  }

  // 85
  if (/^\d+$/.test(token)) {
    return { target: Number(token), decimals: 0, decimalSep: ',', groupSep: '' };
  }

  return null;
}
