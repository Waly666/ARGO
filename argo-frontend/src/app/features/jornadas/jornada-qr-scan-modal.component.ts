import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserCodeReader, BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

import {
  JornadaAlumnoQrData,
  parseJornadaAlumnoQr,
} from './jornada-alumno-qr.util';

@Component({
  selector: 'argo-jornada-qr-scan-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jornada-qr-scan-modal.component.html',
  styleUrl: './jornada-qr-scan-modal.component.scss',
})
export class JornadaQrScanModalComponent implements AfterViewInit, OnDestroy {
  private hostEl = inject(ElementRef<HTMLElement>);
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  @Output() closed = new EventEmitter<void>();
  @Output() scanned = new EventEmitter<JornadaAlumnoQrData>();

  readonly devices = signal<MediaDeviceInfo[]>([]);
  readonly deviceId = signal('');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly invalidQr = signal('');

  private reader = new BrowserQRCodeReader(undefined, {
    delayBetweenScanAttempts: 120,
    delayBetweenScanSuccess: 700,
  });
  private controls: IScannerControls | null = null;
  private locked = false;
  private destroyed = false;
  private originalParent: HTMLElement | null = null;
  private originalNextSibling: ChildNode | null = null;

  ngAfterViewInit(): void {
    this.attachToBody();
    void this.prepareCameras();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopCamera();
    this.restoreParent();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  async onDeviceChange(value: string): Promise<void> {
    this.deviceId.set(value);
    await this.startCamera(value);
  }

  async retry(): Promise<void> {
    this.error.set('');
    this.invalidQr.set('');
    await this.prepareCameras();
  }

  close(): void {
    this.stopCamera();
    this.closed.emit();
  }

  private async prepareCameras(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      this.loading.set(false);
      this.error.set(
        'La cámara requiere una conexión segura HTTPS (o localhost) y un navegador compatible.',
      );
      return;
    }

    try {
      // Solicita permiso primero para que enumerateDevices revele nombres y cámaras.
      const permiso = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      permiso.getTracks().forEach((track) => track.stop());

      const cameras = await BrowserCodeReader.listVideoInputDevices();
      if (this.destroyed) return;
      this.devices.set(cameras);
      if (!cameras.length) {
        this.error.set('No se detectó ninguna cámara en este equipo.');
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
        this.error.set(
          'No se concedió permiso para usar la cámara. Habilítelo en el navegador e inténtelo de nuevo.',
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        this.error.set('No se encontró una cámara disponible.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        this.error.set('La cámara está ocupada por otra aplicación o no pudo iniciarse.');
      } else {
        this.error.set('No fue posible iniciar la cámara.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async startCamera(deviceId: string): Promise<void> {
    this.stopCamera();
    this.loading.set(true);
    this.error.set('');
    this.invalidQr.set('');
    this.locked = false;

    try {
      this.controls = await this.reader.decodeFromVideoDevice(
        deviceId || undefined,
        this.videoRef.nativeElement,
        (result) => {
          if (!result || this.locked) return;
          const parsed = parseJornadaAlumnoQr(result.getText());
          if (!parsed) {
            this.invalidQr.set('QR no válido. Use una etiqueta de jornadas ARGO.');
            return;
          }
          this.locked = true;
          this.invalidQr.set('');
          this.stopCamera();
          this.scanned.emit(parsed);
        },
      );
    } catch {
      if (!this.destroyed) this.error.set('No fue posible abrir la cámara seleccionada.');
    } finally {
      this.loading.set(false);
    }
  }

  private stopCamera(): void {
    this.controls?.stop();
    this.controls = null;
    BrowserCodeReader.releaseAllStreams();
    const video = this.videoRef?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }

  /** Evita quedar detrás del FormModal, que también se teletransporta al body. */
  private attachToBody(): void {
    const host = this.hostEl.nativeElement;
    if (host.parentElement === document.body) return;
    this.originalParent = host.parentElement;
    this.originalNextSibling = host.nextSibling;
    document.body.appendChild(host);
  }

  private restoreParent(): void {
    const host = this.hostEl.nativeElement;
    if (!this.originalParent || host.parentElement !== document.body) return;
    if (this.originalNextSibling?.parentElement === this.originalParent) {
      this.originalParent.insertBefore(host, this.originalNextSibling);
    } else {
      this.originalParent.appendChild(host);
    }
    this.originalParent = null;
    this.originalNextSibling = null;
  }
}
