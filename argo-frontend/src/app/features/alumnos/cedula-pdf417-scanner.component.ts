import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserCodeReader, BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

import {
  CedulaPdf417Data,
  parseCedulaColombianaPdf417,
} from './cedula-pdf417.util';

@Component({
  selector: 'argo-cedula-pdf417-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cedula-pdf417-scanner.component.html',
  styleUrl: './cedula-pdf417-scanner.component.scss',
})
export class CedulaPdf417ScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('lectorInput') lectorInput?: ElementRef<HTMLTextAreaElement>;

  @Output() scanned = new EventEmitter<CedulaPdf417Data>();

  readonly modo = signal<'camera' | 'lector'>('camera');
  readonly devices = signal<MediaDeviceInfo[]>([]);
  readonly deviceId = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly rawLector = signal('');
  readonly resolution = signal('');
  readonly zoomDisponible = signal(false);
  readonly zoomMin = signal(1);
  readonly zoomMax = signal(1);
  readonly zoomStep = signal(0.1);
  readonly zoomValue = signal(1);
  readonly torchDisponible = signal(false);
  readonly torchOn = signal(false);
  readonly analizandoCaptura = signal(false);

  private controls: IScannerControls | null = null;
  private lectorTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private locked = false;
  private readonly reader = new BrowserMultiFormatReader(
    new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]],
      [DecodeHintType.TRY_HARDER, true],
    ]),
    { delayBetweenScanAttempts: 150, delayBetweenScanSuccess: 800 },
  );

  ngAfterViewInit(): void {
    void this.prepareCameras();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.lectorTimer) clearTimeout(this.lectorTimer);
    this.stopCamera();
  }

  async seleccionarModo(modo: 'camera' | 'lector'): Promise<void> {
    if (this.modo() === modo) return;
    this.modo.set(modo);
    this.error.set('');
    if (modo === 'lector') {
      this.stopCamera();
      setTimeout(() => this.lectorInput?.nativeElement.focus());
      return;
    }
    await this.prepareCameras();
  }

  async onDeviceChange(value: string): Promise<void> {
    this.deviceId.set(value);
    await this.startCamera(value);
  }

  async retry(): Promise<void> {
    this.error.set('');
    await this.prepareCameras();
  }

  procesarLector(event?: Event): void {
    event?.preventDefault();
    if (this.lectorTimer) clearTimeout(this.lectorTimer);
    const raw = this.rawLector();
    this.rawLector.set('');
    this.procesarPayload(raw, 'lector');
  }

  onRawLectorChange(value: string): void {
    this.rawLector.set(value);
    if (this.lectorTimer) clearTimeout(this.lectorTimer);
    if (!value) return;
    this.lectorTimer = setTimeout(() => {
      if (this.rawLector()) this.procesarLector();
    }, 180);
  }

  private async prepareCameras(): Promise<void> {
    if (this.modo() !== 'camera') return;
    this.loading.set(true);
    this.error.set('');

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      this.loading.set(false);
      this.error.set('La cámara requiere HTTPS o localhost. Puede usar el lector físico.');
      return;
    }

    try {
      const permission = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      permission.getTracks().forEach((track) => track.stop());
      const cameras = await BrowserCodeReader.listVideoInputDevices();
      if (this.destroyed || this.modo() !== 'camera') return;
      this.devices.set(cameras);
      if (!cameras.length) {
        this.error.set('No se detectó una cámara. Puede usar el lector físico.');
        return;
      }
      const preferred =
        cameras.find((d) => /back|rear|environment|trasera|posterior/i.test(d.label)) ||
        cameras[cameras.length - 1];
      this.deviceId.set(preferred.deviceId);
      await this.startCamera(preferred.deviceId);
    } catch (e) {
      if (this.destroyed) return;
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.error.set('Permita el acceso a la cámara o use el lector físico PDF417.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        this.error.set('La cámara está ocupada por otra aplicación.');
      } else {
        this.error.set('No fue posible iniciar la cámara. Puede usar el lector físico.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async startCamera(deviceId: string): Promise<void> {
    this.stopCamera();
    this.loading.set(true);
    this.error.set('');
    this.locked = false;
    try {
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: 'continuous' }],
        },
        audio: false,
      } as unknown as MediaStreamConstraints;
      this.controls = await this.reader.decodeFromConstraints(
        constraints,
        this.videoRef.nativeElement,
        (result) => {
          if (!result || this.locked) return;
          this.procesarPayload(result.getText(), 'cámara');
        },
      );
      await this.detectarCapacidadesCamara();
    } catch {
      if (!this.destroyed) this.error.set('No fue posible abrir la cámara seleccionada.');
    } finally {
      this.loading.set(false);
    }
  }

  private procesarPayload(raw: string, origen: 'cámara' | 'lector'): void {
    const parsed = parseCedulaColombianaPdf417(raw);
    if (!parsed) {
      this.rawLector.set('');
      this.error.set(
        `No se reconoció una cédula colombiana válida desde ${origen}. Asegúrese de leer el PDF417 completo.`,
      );
      return;
    }
    this.locked = true;
    this.error.set('');
    this.stopCamera();
    this.rawLector.set('');
    this.scanned.emit(parsed);
  }

  async aplicarZoom(value: number | string): Promise<void> {
    const zoom = Number(value);
    const track = this.videoTrack();
    if (!track || !Number.isFinite(zoom)) return;
    try {
      await track.applyConstraints({
        advanced: [{ zoom } as unknown as MediaTrackConstraintSet],
      });
      this.zoomValue.set(zoom);
    } catch {
      this.error.set('Esta cámara no permitió cambiar el zoom.');
    }
  }

  async alternarLinterna(): Promise<void> {
    if (!this.controls?.switchTorch) return;
    const next = !this.torchOn();
    try {
      await this.controls.switchTorch(next);
      this.torchOn.set(next);
    } catch {
      this.error.set('No fue posible cambiar la linterna de esta cámara.');
    }
  }

  async capturarYAnalizar(): Promise<void> {
    const video = this.videoRef.nativeElement;
    if (!video.videoWidth || !video.videoHeight) return;
    this.analizandoCaptura.set(true);
    this.error.set('');
    try {
      const cropWidth = Math.round(video.videoWidth * 0.88);
      const cropHeight = Math.round(video.videoHeight * 0.42);
      const sx = Math.round((video.videoWidth - cropWidth) / 2);
      const sy = Math.round((video.videoHeight - cropHeight) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth * 2;
      canvas.height = cropHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(video, sx, sy, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      const result = this.reader.decodeFromCanvas(canvas);
      this.procesarPayload(result.getText(), 'cámara');
    } catch {
      this.error.set(
        'La captura no pudo leerse. Ajuste distancia, enfoque o zoom y vuelva a intentarlo.',
      );
    } finally {
      this.analizandoCaptura.set(false);
    }
  }

  async analizarImagen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.analizandoCaptura.set(true);
    this.error.set('');
    const url = URL.createObjectURL(file);
    try {
      const result = await this.reader.decodeFromImageUrl(url);
      this.procesarPayload(result.getText(), 'cámara');
    } catch {
      this.error.set('No se encontró un PDF417 legible en la imagen seleccionada.');
    } finally {
      URL.revokeObjectURL(url);
      input.value = '';
      this.analizandoCaptura.set(false);
    }
  }

  private async detectarCapacidadesCamara(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const track = this.videoTrack();
    if (!track) return;
    const settings = track.getSettings() as MediaTrackSettings & { zoom?: number };
    this.resolution.set(
      settings.width && settings.height ? `${settings.width} × ${settings.height}` : '',
    );
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: { min: number; max: number; step?: number };
      torch?: boolean;
      focusMode?: string[];
    };
    if (capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min) {
      this.zoomDisponible.set(true);
      this.zoomMin.set(capabilities.zoom.min);
      this.zoomMax.set(capabilities.zoom.max);
      this.zoomStep.set(capabilities.zoom.step || 0.1);
      this.zoomValue.set(settings.zoom ?? capabilities.zoom.min);
    } else {
      this.zoomDisponible.set(false);
    }
    this.torchDisponible.set(capabilities.torch === true && !!this.controls?.switchTorch);
    if (capabilities.focusMode?.includes('continuous')) {
      await track
        .applyConstraints({
          advanced: [
            { focusMode: 'continuous' } as unknown as MediaTrackConstraintSet,
          ],
        })
        .catch(() => {});
    }
  }

  private videoTrack(): MediaStreamTrack | null {
    const stream = this.videoRef?.nativeElement.srcObject as MediaStream | null;
    return stream?.getVideoTracks()[0] || null;
  }

  private stopCamera(): void {
    this.controls?.stop();
    this.controls = null;
    this.torchOn.set(false);
    this.resolution.set('');
    const video = this.videoRef?.nativeElement;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }
}
