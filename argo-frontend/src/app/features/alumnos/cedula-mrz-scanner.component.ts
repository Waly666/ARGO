import {
  Component,
  ElementRef,
  OnDestroy,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AlumnoService } from '../../core/services/alumno.service';
import {
  CedulaMrzData,
  parseCedulaColombianaMrz,
} from './cedula-mrz.util';

@Component({
  selector: 'argo-cedula-mrz-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cedula-mrz-scanner.component.html',
  styleUrl: './cedula-mrz-scanner.component.scss',
})
export class CedulaMrzScannerComponent implements OnDestroy {
  private readonly alumnoSvc = inject(AlumnoService);

  scanned = output<CedulaMrzData>();

  preview = signal<string | null>(null);
  file = signal<File | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  /** Texto pegado (propiedad normal para ngModel estable). */
  textoMrz = '';
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  private objectUrl: string | null = null;

  ngOnDestroy(): void {
    this.revokePreview();
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const selected = input.files?.[0];
    if (!selected) return;
    this.error.set(null);
    this.file.set(selected);
    this.revokePreview();
    this.objectUrl = URL.createObjectURL(selected);
    this.preview.set(this.objectUrl);
  }

  limpiarArchivo(): void {
    this.file.set(null);
    this.revokePreview();
    this.preview.set(null);
    const el = this.fileInput()?.nativeElement;
    if (el) el.value = '';
  }

  async leerDesdeArchivo(): Promise<void> {
    const selected = this.file();
    if (!selected) {
      this.error.set('Seleccione una imagen del reverso con las 3 líneas MRZ.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.alumnoSvc.escanearCedulaMrz(selected));
      const data = res?.sugerido;
      if (!data?.numDoc || !data?.apellido1 || !data?.nombre1) {
        this.error.set('No se pudieron extraer los datos de la MRZ. Intente otra imagen o pegue el texto.');
        return;
      }
      this.scanned.emit({
        tipoDoc: data.tipoDoc || '1',
        numDoc: String(data.numDoc),
        apellido1: String(data.apellido1),
        apellido2: data.apellido2 ? String(data.apellido2) : undefined,
        nombre1: String(data.nombre1),
        nombre2: data.nombre2 ? String(data.nombre2) : undefined,
        genero: data.genero || undefined,
        fechaNac: data.fechaNac || undefined,
      });
    } catch (err: unknown) {
      const msg =
        (err as { error?: { message?: string } })?.error?.message ||
        'No se pudo leer la zona MRZ. Use una foto nítida o pegue las 3 líneas.';
      this.error.set(
        msg +
          ' Si la foto no funciona, use «Cargar ejemplo» o pegue las 3 líneas MRZ del reverso.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  procesarTexto(): void {
    this.error.set(null);
    const raw = String(this.textoMrz || '').trim();
    if (!raw) {
      this.error.set('Pegue las 3 líneas MRZ del reverso y luego pulse Procesar texto MRZ.');
      return;
    }
    const parsed = parseCedulaColombianaMrz(raw);
    if (!parsed) {
      this.error.set(
        'Texto MRZ inválido. Ejemplo:\nICCOL008176824852001<<<<<<<<<<\n7010103M3210204COL17344720<<<0\nDE<LA<PENA<MUNOZ<<JUAN<CARLOS<',
      );
      return;
    }
    this.scanned.emit(parsed);
  }

  cargarEjemplo(): void {
    this.textoMrz = [
      'ICCOL008176824852001<<<<<<<<<<',
      '7010103M3210204COL17344720<<<0',
      'DE<LA<PENA<MUNOZ<<JUAN<CARLOS<',
    ].join('\n');
    this.error.set(null);
  }

  private revokePreview(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
