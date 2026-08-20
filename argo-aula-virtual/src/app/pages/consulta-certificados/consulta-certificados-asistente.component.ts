import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';

import { PortalAsistenteViewConfig } from '../../core/portal-landing';
import { resolveConsultaAsistenteVideoUrl } from '../../core/consulta-asistente-video.util';
import { startAssistantChromaLoop } from './consulta-asistente-chroma.util';

const POSITION_KEY = 'argo.consulta-certificados.asistente.position';
const INTRO_KEY = 'argo.consulta-certificados.asistente.intro';
const VOICE_KEY = 'argo.consulta-certificados.asistente.voice';

const FEMALE_VOICE_HINTS =
  /\b(dalia|salome|elena|catalina|paloma|paulina|luciana|penelope|helena|sofia|maria|laura|monica|beatriz|isabella|raquel|sabina|ximena|renata|valentina|female|mujer|woman|girl)\b/i;
const MALE_VOICE_HINTS =
  /\b(jorge|gonzalo|miguel|diego|tomas|lorenzo|alonso|alex|sebastian|male|hombre|man|pablo|rodrigo|carlos|andres|felipe|marcelo|alvaro|juan|ricardo|eduardo|raul|hector)\b/i;

@Component({
  selector: 'av-consulta-certificados-asistente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-certificados-asistente.component.html',
  styleUrl: './consulta-certificados-asistente.component.scss',
})
export class ConsultaCertificadosAsistenteComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) config!: PortalAsistenteViewConfig;

  @ViewChild('root') rootRef?: ElementRef<HTMLElement>;
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly posterUrl = '/images/asistente-educarte.png';

  enabled = signal(false);
  speaking = signal(false);
  paused = signal(false);
  dragging = signal(false);
  bubbleVisible = signal(false);
  bubbleText = signal('');
  voiceMenuOpen = signal(false);
  voiceBadge = signal('ES');
  hasTransparentAvatar = signal(false);
  useImageFallback = signal(false);

  private dragMoved = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private bubbleTimer: ReturnType<typeof setTimeout> | null = null;
  private clickTimer: ReturnType<typeof setTimeout> | null = null;
  private stopChroma: (() => void) | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  selectedVoice: SpeechSynthesisVoice | null = null;
  private pointerCleanup: (() => void) | null = null;
  private resizeHandler = () => this.persistPosition();
  private videoSilenceBound = false;

  ngAfterViewInit(): void {
    const root = this.rootRef?.nativeElement;
    if (!root) return;

    this.restorePosition(root);
    this.pointerCleanup = this.bindDrag(root);
    window.addEventListener('resize', this.resizeHandler);
    this.loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', () => this.loadVoices());

    queueMicrotask(() => this.setupVideo());

    if (!localStorage.getItem(INTRO_KEY)) {
      localStorage.setItem(INTRO_KEY, '1');
      window.setTimeout(() => {
        this.showBubble('Hola, soy tu guía. Arrástrame y haz clic para que te lea el mensaje.');
      }, 900);
    }
  }

  ngOnDestroy(): void {
    this.stopReading();
    this.stopChroma?.();
    const video = this.videoRef?.nativeElement;
    video?.removeEventListener('play', this.onVideoPlaySilence);
    video?.removeEventListener('volumechange', this.onVideoVolumeSilence);
    this.pointerCleanup?.();
    window.removeEventListener('resize', this.resizeHandler);
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    if (this.clickTimer) clearTimeout(this.clickTimer);
  }

  videoSrc(): string {
    return resolveConsultaAsistenteVideoUrl(this.config);
  }

  texto(): string {
    return this.config?.asistenteTexto?.trim() || '';
  }

  private enforceAvatarVideoSilent(video?: HTMLVideoElement | null): void {
    const el = video ?? this.videoRef?.nativeElement;
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.volume = 0;
    el.setAttribute('muted', '');
  }

  onVideoLoaded(): void {
    this.enforceAvatarVideoSilent();
    this.setupVideo();
  }

  onVideoError(): void {
    this.useImageFallback.set(true);
    this.hasTransparentAvatar.set(false);
    this.stopChroma?.();
    this.stopChroma = null;
  }

  toggleVoiceMenu(event: Event): void {
    event.stopPropagation();
    this.voiceMenuOpen.update((v) => !v);
  }

  closeVoiceMenu(): void {
    this.voiceMenuOpen.set(false);
  }

  selectVoice(voice: SpeechSynthesisVoice): void {
    this.selectedVoice = voice;
    localStorage.setItem(VOICE_KEY, voice.voiceURI || voice.name);
    this.voiceBadge.set(this.voiceRegion(voice));
    this.voiceMenuOpen.set(false);
    this.showBubble(`Voz: ${voice.name}`);
  }

  onMascotClick(): void {
    if (this.dragMoved) {
      this.dragMoved = false;
      return;
    }

    if (this.clickTimer) clearTimeout(this.clickTimer);
    this.clickTimer = setTimeout(() => this.handleMascotClick(), 260);
  }

  onMascotDblClick(event: Event): void {
    event.preventDefault();
    if (this.clickTimer) clearTimeout(this.clickTimer);
    if (!this.enabled()) return;
    this.togglePause();
  }

  private handleMascotClick(): void {
    if (!this.texto()) return;

    if (this.enabled()) {
      this.setEnabled(false);
      this.showBubble('Descanso un momento. Clic cuando quieras volver.');
      this.playChime('off');
      return;
    }

    this.setEnabled(true);
    this.showBubble('Te leo el mensaje institucional.');
    this.playChime('on');
    this.startReading();
  }

  private togglePause(): void {
    if (!this.enabled()) return;

    if (this.paused()) {
      this.paused.set(false);
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      this.syncVideoPlayback();
      this.showBubble('Continúo leyendo.');
    } else {
      this.paused.set(true);
      if (this.speaking()) window.speechSynthesis.pause();
      this.syncVideoPlayback();
      this.showBubble('Lectura en pausa.');
    }

    this.playChime('tap');
  }

  private setEnabled(value: boolean): void {
    this.enabled.set(value);
    if (!value) this.stopReading();
    this.syncVideoPlayback();
  }

  private startReading(): void {
    const text = this.texto();
    if (!text || !window.speechSynthesis) return;

    this.stopReading(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.selectedVoice?.lang || 'es-CO';
    utterance.rate = 0.95;
    if (this.selectedVoice) utterance.voice = this.selectedVoice;

    utterance.onstart = () => {
      this.speaking.set(true);
      this.paused.set(false);
      this.syncVideoPlayback();
    };

    utterance.onend = () => {
      this.speaking.set(false);
      this.syncVideoPlayback();
      this.showBubble('Mensaje leído. Clic para desactivar.');
    };

    utterance.onerror = () => {
      this.speaking.set(false);
      this.syncVideoPlayback();
    };

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private stopReading(cancelEnabled = true): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.utterance = null;
    this.speaking.set(false);
    this.paused.set(false);
    if (cancelEnabled) this.enabled.set(false);
    this.syncVideoPlayback();
  }

  private showBubble(message: string): void {
    this.bubbleText.set(message);
    this.bubbleVisible.set(true);

    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    this.bubbleTimer = setTimeout(() => {
      this.bubbleVisible.set(false);
    }, 3200);
  }

  private setupVideo(): void {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || this.useImageFallback()) return;
    if (video.readyState < 2) return;

    this.enforceAvatarVideoSilent(video);
    if (!this.videoSilenceBound) {
      this.videoSilenceBound = true;
      video.addEventListener('play', this.onVideoPlaySilence);
      video.addEventListener('volumechange', this.onVideoVolumeSilence);
    }

    this.stopChroma?.();
    this.stopChroma = startAssistantChromaLoop(video, canvas, () => this.syncVideoPlayback());
    this.hasTransparentAvatar.set(true);
    this.syncVideoPlayback();
  }

  private readonly onVideoPlaySilence = (): void => {
    this.enforceAvatarVideoSilent();
  };

  private readonly onVideoVolumeSilence = (): void => {
    const video = this.videoRef?.nativeElement;
    if (!video || video.muted) return;
    this.enforceAvatarVideoSilent(video);
  };

  private syncVideoPlayback(): void {
    const video = this.videoRef?.nativeElement;
    if (!video || this.useImageFallback()) return;

    this.enforceAvatarVideoSilent(video);

    if (this.paused()) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    playPromise?.catch(() => {
      /* autoplay puede requerir interacción previa */
    });
  }

  private loadVoices(): void {
    if (!window.speechSynthesis) return;

    const voices = this.getMaleSpanishVoices();
    if (!voices.length) return;

    const saved = localStorage.getItem(VOICE_KEY);
    const savedVoice = saved
      ? voices.find((v) => v.voiceURI === saved || v.name === saved)
      : null;

    const latin =
      savedVoice ||
      voices.find((v) => /colombia|mexico|latino|es-co|es-mx/i.test(`${v.name} ${v.lang}`)) ||
      voices[0];

    this.selectedVoice = latin;
    localStorage.setItem(VOICE_KEY, latin.voiceURI || latin.name);
    this.voiceBadge.set(this.voiceRegion(latin));
  }

  availableVoices(): SpeechSynthesisVoice[] {
    return this.getMaleSpanishVoices();
  }

  private getMaleSpanishVoices(): SpeechSynthesisVoice[] {
    if (!window.speechSynthesis) return [];
    return window.speechSynthesis
      .getVoices()
      .filter((v) => /^es/i.test(v.lang))
      .filter((v) => this.isMaleVoice(v));
  }

  private isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    return FEMALE_VOICE_HINTS.test(name);
  }

  private isMaleVoice(voice: SpeechSynthesisVoice): boolean {
    if (!voice || this.isFemaleVoice(voice)) return false;
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    return MALE_VOICE_HINTS.test(name);
  }

  private voiceRegion(voice: SpeechSynthesisVoice): string {
    const lang = (voice.lang || '').toUpperCase();
    if (lang.includes('CO')) return 'CO';
    if (lang.includes('MX')) return 'MX';
    if (lang.includes('AR')) return 'AR';
    if (lang.includes('CL')) return 'CL';
    return 'ES';
  }

  private bindDrag(root: HTMLElement): () => void {
    const mascot = root.querySelector('[data-cc-mascot]') as HTMLElement | null;
    if (!mascot) return () => undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      this.dragging.set(true);
      this.dragMoved = false;
      const rect = root.getBoundingClientRect();
      this.dragOffsetX = event.clientX - rect.left;
      this.dragOffsetY = event.clientY - rect.top;
      mascot.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!this.dragging()) return;
      const nextLeft = event.clientX - this.dragOffsetX;
      const nextTop = event.clientY - this.dragOffsetY;
      if (Math.abs(nextLeft - root.offsetLeft) > 4 || Math.abs(nextTop - root.offsetTop) > 4) {
        this.dragMoved = true;
      }
      this.applyPosition(root, nextLeft, nextTop, false);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!this.dragging()) return;
      this.dragging.set(false);
      mascot.releasePointerCapture(event.pointerId);
      this.persistPosition();
    };

    mascot.addEventListener('pointerdown', onPointerDown);
    mascot.addEventListener('pointermove', onPointerMove);
    mascot.addEventListener('pointerup', onPointerUp);
    mascot.addEventListener('pointercancel', onPointerUp);

    return () => {
      mascot.removeEventListener('pointerdown', onPointerDown);
      mascot.removeEventListener('pointermove', onPointerMove);
      mascot.removeEventListener('pointerup', onPointerUp);
      mascot.removeEventListener('pointercancel', onPointerUp);
    };
  }

  private restorePosition(root: HTMLElement): void {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null') as {
        left?: number;
        top?: number;
      } | null;
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        this.applyPosition(root, saved.left!, saved.top!, false);
        return;
      }
    } catch {
      /* ignore */
    }

    this.applyPosition(
      root,
      window.innerWidth - (root.offsetWidth || 260) - 20,
      window.innerHeight - (root.offsetHeight || 320) - 20,
      false,
    );
  }

  private applyPosition(root: HTMLElement, left: number, top: number, persist: boolean): void {
    const width = root.offsetWidth || 260;
    const height = root.offsetHeight || 320;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    const nextLeft = Math.min(Math.max(8, left), maxLeft);
    const nextTop = Math.min(Math.max(8, top), maxTop);

    root.style.left = `${nextLeft}px`;
    root.style.top = `${nextTop}px`;
    root.style.right = 'auto';
    root.style.bottom = 'auto';

    if (persist) {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ left: nextLeft, top: nextTop }));
    }
  }

  private persistPosition(): void {
    const root = this.rootRef?.nativeElement;
    if (!root) return;
    this.applyPosition(root, root.offsetLeft, root.offsetTop, true);
  }

  private playChime(kind: 'on' | 'off' | 'tap'): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = kind === 'on' ? 740 : kind === 'off' ? 420 : 560;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'on' ? 0.18 : 0.12));
      osc.stop(now + 0.2);
      osc.onended = () => ctx.close();
    } catch {
      /* optional */
    }
  }
}
