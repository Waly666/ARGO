import { CommonModule } from '@angular/common';
import { Component, ElementRef, computed, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { AulaApiService } from '../../core/aula-api.service';
import { CertificadoPortal, CursoVirtual, PortalConfig, ReciboPortal } from '../../core/models';
import { PortalAuthService } from '../../core/portal-auth.service';
import { resolveUploadUrl } from '../../core/upload-url.util';
import { environment } from '../../../environments/environment';

export type PanelAula = 'tablero' | 'cursos' | 'certificados' | 'perfil';

@Component({
  selector: 'av-aula',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss',
})
export class AulaComponent implements OnInit, OnDestroy {
  auth = inject(PortalAuthService);
  private api = inject(AulaApiService);
  private sanitizer = inject(DomSanitizer);
  private router = inject(Router);

  cursos = signal<CursoVirtual[]>([]);
  certificados = signal<CertificadoPortal[]>([]);
  certificadosLoading = signal(false);
  certificadoError = signal('');
  reciboError = signal('');
  portalConfig = signal<PortalConfig | null>(null);
  panel = signal<PanelAula>('tablero');
  sidebarCollapsed = signal(false);

  safePlayerUrl = signal<SafeResourceUrl | null>(null);
  playerTitulo = signal('');
  cursoActivo = signal<CursoVirtual | null>(null);
  avisoPlayer = signal('');

  playerFrame = viewChild<ElementRef<HTMLIFrameElement>>('playerFrame');

  totalInscritos = computed(() => this.cursos().length);
  totalEnProgreso = computed(() => this.cursos().filter((c) => this.enProgreso(c)).length);
  totalCompletados = computed(() => this.cursos().filter((c) => this.completado(c)).length);
  totalCertificados = computed(() => this.certificados().length);

  cursosContinuar = computed(() =>
    [...this.cursos()]
      .filter((c) => this.enProgreso(c) || (this.pct(c) === 0 && c.tienePaquete))
      .sort((a, b) => this.pct(b) - this.pct(a))
      .slice(0, 4),
  );

  private onMessage = (ev: MessageEvent) => this.handleIframeMessage(ev);
  private onVisibility = () => {
    if (document.visibilityState === 'visible' && this.auth.isLoggedIn()) {
      this.cargarCursos();
      this.cargarCertificados();
    }
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private initTimers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit() {
    this.api.config().subscribe({
      next: (c) => this.portalConfig.set(c),
      error: () => this.portalConfig.set(null),
    });
    if (!this.auth.isLoggedIn()) return;
    this.cargarCursos();
    this.cargarCertificados();
    window.addEventListener('message', this.onMessage);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.onMessage);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.detenerPoll();
    this.initTimers.forEach(clearTimeout);
  }

  irPanel(p: PanelAula) {
    this.panel.set(p);
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  pct(c: CursoVirtual): number {
    return c.progreso?.pctCompletitud ?? 0;
  }

  completado(c: CursoVirtual): boolean {
    const p = c.progreso;
    return !!(p?.aprobado || p?.certificadoEmitido || this.pct(c) >= 100);
  }

  enProgreso(c: CursoVirtual): boolean {
    return this.pct(c) > 0 && !this.completado(c);
  }

  portada(c: CursoVirtual): string | null {
    return resolveUploadUrl(c.urlPortadaAbsoluta || c.urlPortadaVirtual);
  }

  portalLogo(): string | null {
    const cfg = this.portalConfig();
    return resolveUploadUrl(cfg?.urlLogoAbsoluta || cfg?.urlLogo);
  }

  etiquetas(c: CursoVirtual): string[] {
    if (c.categoriaNombres?.length) return c.categoriaNombres.slice(0, 2);
    if (c.categoriaNombre) return [c.categoriaNombre];
    if (c.nivel) return [c.nivel];
    return ['Curso virtual'];
  }

  fechaInicio(c: CursoVirtual): string {
    const f = c.matricula?.fechaMat;
    if (!f) return '—';
    const d = new Date(f);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  saludo(): string {
    const u = this.auth.user();
    const nombre = u?.nombreCompleto?.split(' ')[0] || u?.email?.split('@')[0] || 'estudiante';
    return nombre;
  }

  cargarCursos() {
    this.api.misCursos().subscribe({
      next: (rows) => this.cursos.set(rows),
      error: () => this.cursos.set([]),
    });
  }

  cargarCertificados() {
    this.certificadosLoading.set(true);
    this.api.misCertificados().subscribe({
      next: (rows) => {
        this.certificados.set(rows || []);
        this.certificadosLoading.set(false);
      },
      error: () => {
        this.certificados.set([]);
        this.certificadosLoading.set(false);
      },
    });
  }

  certificadoDeCurso(idPrograma: string | number): CertificadoPortal | undefined {
    return this.certificados().find((c) => String(c.idProg) === String(idPrograma));
  }

  verCertificado(cert: CertificadoPortal) {
    this.certificadoError.set('');
    this.api.abrirCertificado(cert._id, (msg) => this.certificadoError.set(msg));
  }

  imprimirCertificado(cert: CertificadoPortal) {
    this.verCertificado(cert);
  }

  reciboDeCurso(c: CursoVirtual): ReciboPortal | null {
    return c.pago?.recibo || null;
  }

  imprimirRecibo(idIngreso: string | null | undefined) {
    this.reciboError.set('');
    this.api.abrirRecibo(idIngreso || '', (msg) => this.reciboError.set(msg));
  }

  imprimirReciboCert(cert: CertificadoPortal) {
    this.imprimirRecibo(cert.recibo?.idIngreso);
  }

  imprimirReciboCurso(c: CursoVirtual) {
    this.imprimirRecibo(this.idReciboCurso(c));
  }

  idReciboCurso(c: CursoVirtual): string | null {
    const cert = this.certificadoDeCurso(c.idPrograma);
    return cert?.recibo?.idIngreso || this.reciboDeCurso(c)?.idIngreso || null;
  }

  fechaCert(f?: string | null): string {
    if (!f) return '—';
    const d = new Date(f);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO', { dateStyle: 'medium' });
  }

  tituloCert(cert: CertificadoPortal): string {
    return cert.encabezado || cert.nomCert || cert.programaDescr || 'Certificado';
  }

  puedeCursar(c: CursoVirtual): boolean {
    if (c.puedeCursar === false) return false;
    if (c.accesoBloqueadoPago) return false;
    if (c.requierePagoParaCursar && c.pago && !c.pago.pagado) return false;
    return !!c.tienePaquete;
  }

  abrir(curso: CursoVirtual) {
    if (!this.puedeCursar(curso)) {
      this.avisoPlayer.set('Complete el pago en el CEA para acceder a este curso.');
      return;
    }
    if (!curso.playerUrl) return;
    const full = this.resolverPlayerUrl(curso.playerUrl);
    this.safePlayerUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(full));
    this.playerTitulo.set(curso.nombreProg);
    this.cursoActivo.set(curso);
    this.avisoPlayer.set('');
    this.iniciarPoll(curso);
  }

  cerrarPlayer() {
    this.detenerPoll();
    this.initTimers.forEach(clearTimeout);
    this.initTimers = [];

    const curso = this.cursoActivo();
    const frame = this.playerFrame()?.nativeElement;
    if (frame?.contentWindow) {
      frame.contentWindow.postMessage({ type: 'ARGO_SYNC_REQUEST' }, '*');
    }

    const finalizar = () => {
      this.safePlayerUrl.set(null);
      this.playerTitulo.set('');
      this.cursoActivo.set(null);
      this.avisoPlayer.set('');
      this.cargarCursos();
      this.cargarCertificados();
    };

    if (curso) {
      setTimeout(() => {
        this.api.progreso(curso.idPrograma).subscribe({
          next: (data) => {
            this.aplicarProgreso(String(curso.idPrograma), data.progreso, data.reglas);
            finalizar();
          },
          error: () => finalizar(),
        });
      }, 700);
      return;
    }

    finalizar();
  }

  onIframeLoad() {
    this.enviarInitAlIframe();
    this.initTimers.forEach(clearTimeout);
    this.initTimers = [
      setTimeout(() => this.enviarInitAlIframe(), 600),
      setTimeout(() => this.enviarInitAlIframe(), 1800),
    ];
  }

  logout() {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  private resolverPlayerUrl(raw: string): string {
    const uploadsBase = environment.uploadsUrl.replace(/\/+$/, '');
    const pathMatch = raw.match(/\/uploads\/(.+)$/i);
    if (pathMatch) return `${uploadsBase}/${pathMatch[1]}`;
    if (raw.startsWith('/uploads/')) return `${uploadsBase}${raw.slice('/uploads'.length)}`;
    if (raw.startsWith('http')) return raw;
    return `${uploadsBase}/${raw.replace(/^\/+/, '')}`;
  }

  private enviarInitAlIframe() {
    const curso = this.cursoActivo();
    const token = this.auth.token();
    const frame = this.playerFrame()?.nativeElement;
    if (!curso || !token || !frame?.contentWindow) return;

    const payload = {
      type: 'ARGO_INIT',
      apiUrl: `${environment.apiUrl}/aula-virtual`,
      token,
      idPrograma: String(curso.idPrograma),
    };
    frame.contentWindow.postMessage(payload, '*');
    frame.contentWindow.postMessage({ type: 'ARGO_SYNC_REQUEST' }, '*');
  }

  private iniciarPoll(curso: CursoVirtual) {
    this.detenerPoll();
    this.pollTimer = setInterval(() => this.refrescarProgreso(curso.idPrograma), 10000);
  }

  private detenerPoll() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private refrescarProgreso(idPrograma: string | number) {
    this.api.progreso(idPrograma).subscribe({
      next: (data) => this.aplicarProgreso(String(idPrograma), data.progreso, data.reglas),
    });
    this.enviarInitAlIframe();
  }

  private aplicarProgreso(
    idPrograma: string,
    progreso: CursoVirtual['progreso'],
    reglas: CursoVirtual['reglas'],
  ) {
    if (!progreso) return;
    const curso = this.cursoActivo();
    if (curso && String(curso.idPrograma) === idPrograma) {
      this.cursoActivo.set({ ...curso, progreso, reglas: reglas ?? curso.reglas });
    }
    this.cursos.update((rows) =>
      rows.map((c) =>
        String(c.idPrograma) === idPrograma ? { ...c, progreso, reglas: reglas ?? c.reglas } : c,
      ),
    );
  }

  private handleIframeMessage(ev: MessageEvent) {
    const data = ev.data;
    if (!data || data.type !== 'ARGO_PROGRESO_ACTUALIZADO') return;
    const curso = this.cursoActivo();
    if (!curso || String(data.idPrograma) !== String(curso.idPrograma)) return;

    if (data.progreso) {
      this.aplicarProgreso(String(curso.idPrograma), data.progreso, data.reglas);
    }

    if (data.certificado?.emitido) {
      this.avisoPlayer.set(`¡Certificado emitido! Código: ${data.certificado.codigoCert || '—'}`);
      this.cargarCertificados();
    } else if (data.aviso) {
      this.avisoPlayer.set(data.aviso);
    }
  }
}
